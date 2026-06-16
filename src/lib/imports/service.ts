import {
  GroupRole,
  ImportStatus,
  Prisma,
} from "@prisma/client";
import { ACTIVITY_ACTIONS } from "@/lib/activity";
import { badRequest, notFound } from "@/lib/api/http";
import { prisma } from "@/lib/db/prisma";
import { createDbNotification } from "@/lib/notifications/service";
import { normalizeToGroupBase } from "@/lib/currency/exchange";
import { calculateSplitAllocations } from "@/lib/expenses/splits";
import { assertGroupIsOpen } from "@/lib/groups/service";
import { requireGroupRole } from "@/lib/memberships/rules";
import { parseImportCsv } from "@/lib/imports/parser";
import { validateImportRows } from "@/lib/imports/validation";
import { generateImportReport } from "@/lib/reports";
import type { ImportUploadInput, ValidImportExpense } from "@/lib/imports/types";

const importSessionInclude = {
  uploadedBy: true,
  anomalies: true,
  expenses: {
    include: {
      paidBy: true,
      participants: { include: { user: true } },
    },
  },
} satisfies Prisma.ImportSessionInclude;

function toMoneyDecimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}

function toRateDecimal(value: number) {
  return new Prisma.Decimal(value.toFixed(6));
}

function participantCreateData(row: ValidImportExpense, baseAmount: number) {
  const allocations = calculateSplitAllocations(
    row.splitType,
    baseAmount,
    row.participants
  );

  return allocations.map((allocation) => ({
    userId: allocation.userId,
    splitValue:
      allocation.rawSplitValue === null
        ? null
        : toMoneyDecimal(allocation.rawSplitValue),
    metadata: {
      calculatedOwedAmount: allocation.owedAmount,
      importRowNumber: row.rowNumber,
    },
  }));
}

function reportStatus(importedRows: number, rejectedRows: number): ImportStatus {
  if (importedRows > 0 && rejectedRows > 0) {
    return ImportStatus.PARTIAL;
  }
  if (importedRows === 0 && rejectedRows > 0) {
    return ImportStatus.FAILED;
  }
  return ImportStatus.COMPLETED;
}

export async function createImportSession(
  actorId: string,
  input: ImportUploadInput
) {
  await assertGroupIsOpen(input.groupId);
  await requireGroupRole(input.groupId, actorId, GroupRole.MEMBER);

  const group = await prisma.group.findUnique({
    where: { id: input.groupId },
    select: { currency: true },
  });
  if (!group) {
    notFound("Group not found");
  }

  if (!input.filename.trim()) {
    badRequest("Import filename is required");
  }

  const startedAt = Date.now();
  const session = await prisma.importSession.create({
    data: {
      groupId: input.groupId,
      uploadedById: actorId,
      filename: input.filename.trim(),
      status: ImportStatus.PENDING,
    },
  });

  // Log import started — OUTSIDE transaction (non-critical write)
  await prisma.activityLog.create({
    data: {
      actorId,
      groupId: input.groupId,
      action: ACTIVITY_ACTIONS.IMPORT_STARTED,
      entityType: "ImportSession",
      entityId: session.id,
      metadata: { filename: session.filename },
    },
  });

  try {
    const rows = parseImportCsv(input.csv, input.mapping);

    await prisma.importSession.update({
      where: { id: session.id },
      data: {
        status: ImportStatus.PROCESSING,
        rowCount: rows.length,
      },
    });

    const validation = await validateImportRows(input.groupId, rows, group.currency, input.strictMode ?? false);
    const createdExpenseIds: string[] = [];

    // === CORE TRANSACTION: Optimized with batch creation ===
    const completed = await prisma.$transaction(
      async (tx) => {
        // Step 1: Create all expenses individually because we need their generated IDs for participants,
        // but avoid any other sub-queries.
        const createdExpenses = [];
        for (const row of validation.validRows) {
          const normalized = normalizeToGroupBase(
            row.amount,
            row.currency,
            group.currency
          );
          const expense = await tx.expense.create({
            data: {
              groupId: input.groupId,
              paidById: row.paidById,
              splitType: row.splitType,
              description: row.description,
              date: row.date,
              originalAmount: toMoneyDecimal(normalized.originalAmount),
              originalCurrency: normalized.originalCurrency,
              exchangeRate: toRateDecimal(normalized.exchangeRate),
              baseAmount: toMoneyDecimal(normalized.baseAmount),
              importSessionId: session.id,
              metadata: {
                importRowNumber: row.rowNumber,
                rawCsvRow: row.raw,
                paidByRaw: row.paidByRaw,
              },
            },
          });
          createdExpenseIds.push(expense.id);
          createdExpenses.push({ expense, row, normalized });
        }

        // Step 2: Bulk insert participants for all expenses using createMany
        const participantsData: Prisma.ExpenseParticipantCreateManyInput[] = [];
        for (const item of createdExpenses) {
          const allocations = calculateSplitAllocations(
            item.row.splitType,
            item.normalized.baseAmount,
            item.row.participants
          );

          allocations.forEach((allocation) => {
            participantsData.push({
              expenseId: item.expense.id,
              userId: allocation.userId,
              splitValue:
                allocation.rawSplitValue === null
                  ? null
                  : toMoneyDecimal(allocation.rawSplitValue),
              metadata: {
                calculatedOwedAmount: allocation.owedAmount,
                importRowNumber: item.row.rowNumber,
              },
            });
          });
        }

        if (participantsData.length > 0) {
          await tx.expenseParticipant.createMany({
            data: participantsData,
          });
        }

        // Step 3: Bulk insert anomalies using createMany
        if (validation.anomalies.length > 0) {
          const anomaliesData = validation.anomalies.map((anomaly) => ({
            importSessionId: session.id,
            expenseId: anomaly.existingExpenseId ?? null,
            type: anomaly.type,
            severity: anomaly.severity,
            payload: {
              rowNumber: anomaly.rowNumber,
              message: anomaly.message,
              ...anomaly.payload,
            } as Prisma.InputJsonObject,
          }));

          await tx.anomaly.createMany({
            data: anomaliesData,
          });
        }

        const report = generateImportReport({
          totalRows: rows.length,
          validation,
          createdExpenseIds,
          processingTimeMs: Date.now() - startedAt,
        });
        const status = reportStatus(report.importedRows, report.rejectedRows);

        const updated = await tx.importSession.update({
          where: { id: session.id },
          data: {
            status,
            processedCount: report.processedRows,
            errorCount: report.rejectedRows,
            rawErrors: validation.rejectedRows as unknown as Prisma.InputJsonValue,
            reportJson: report as unknown as Prisma.InputJsonValue,
            metadata: {
              completedAt: new Date().toISOString(),
              anomalyCount: report.anomalyCount,
            },
          },
          include: importSessionInclude,
        });

        return { updated, report, status };
      },
      {
        timeout: 45000, // generouse timeout
        maxWait: 15000,
      }
    );

    const { updated, report, status } = completed;


    // === POST-TRANSACTION: Activity logs, notifications (non-blocking) ===
    // These run OUTSIDE the transaction — no timeout risk

    // Log anomalies
    if (validation.anomalies.length > 0) {
      const anomalyLogs = validation.anomalies.slice(0, 50).map((anomaly, index) => ({
        actorId,
        groupId: input.groupId,
        action: ACTIVITY_ACTIONS.ANOMALY_CREATED,
        entityType: "Anomaly",
        entityId: `anomaly-${session.id}-${index}`,
        metadata: {
          importSessionId: session.id,
          type: anomaly.type,
          severity: anomaly.severity,
          rowNumber: anomaly.rowNumber,
        },
      }));

      await prisma.activityLog.createMany({ data: anomalyLogs });
    }

    // Log report generated
    await prisma.activityLog.create({
      data: {
        actorId,
        groupId: input.groupId,
        action: ACTIVITY_ACTIONS.REPORT_GENERATED,
        entityType: "ImportSession",
        entityId: session.id,
        metadata: {
          importedRows: report.importedRows,
          rejectedRows: report.rejectedRows,
          anomalyCount: report.anomalyCount,
        },
      },
    });

    // Log import completed/failed
    await prisma.activityLog.create({
      data: {
        actorId,
        groupId: input.groupId,
        action:
          status === ImportStatus.FAILED
            ? ACTIVITY_ACTIONS.IMPORT_FAILED
            : ACTIVITY_ACTIONS.IMPORT_COMPLETED,
        entityType: "ImportSession",
        entityId: session.id,
        metadata: {
          status,
          importedRows: report.importedRows,
          rejectedRows: report.rejectedRows,
        },
      },
    });

    // Notify the uploader
    await createDbNotification({
      userId: actorId,
      type: "IMPORT_COMPLETED",
      title: "Import Completed",
      message: `CSV Import "${session.filename}" finished with status ${updated.status}. Rows imported: ${updated.processedCount - updated.errorCount}, rejected: ${updated.errorCount}.`,
    });

    if (validation.anomalies.length > 0) {
      await createDbNotification({
        userId: actorId,
        type: "ANOMALY_DETECTED",
        title: "Anomaly Warnings Detected",
        message: `${validation.anomalies.length} anomaly warnings were flagged during CSV import "${session.filename}".`,
      });
    }

    return updated;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Import processing failed";

    await prisma.importSession.update({
      where: { id: session.id },
      data: {
        status: ImportStatus.FAILED,
        rawErrors: [{ message }] as Prisma.InputJsonValue,
        metadata: {
          failedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startedAt,
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        actorId,
        groupId: input.groupId,
        action: ACTIVITY_ACTIONS.IMPORT_FAILED,
        entityType: "ImportSession",
        entityId: session.id,
        metadata: { message },
      },
    });

    throw error;
  }
}

export async function listImportSessions(actorId: string, groupId: string) {
  await requireGroupRole(groupId, actorId, GroupRole.MEMBER);

  return prisma.importSession.findMany({
    where: { groupId },
    include: {
      uploadedBy: true,
      _count: { select: { expenses: true, anomalies: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getImportSession(
  actorId: string,
  importSessionId: string
) {
  const session = await prisma.importSession.findUnique({
    where: { id: importSessionId },
    include: importSessionInclude,
  });

  if (!session) {
    notFound("Import session not found");
  }

  await requireGroupRole(session.groupId, actorId, GroupRole.MEMBER);
  return session;
}
