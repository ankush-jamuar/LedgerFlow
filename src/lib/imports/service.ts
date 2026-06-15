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

    const validation = await validateImportRows(input.groupId, rows, group.currency);
    const createdExpenseIds: string[] = [];

    // === CORE TRANSACTION: Only financial writes ===
    // Keep minimal: expenses, anomalies, session status update
    // Activity logs are OUTSIDE to prevent P2028 timeouts
    const completed = await prisma.$transaction(
      async (tx) => {
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
              participants: {
                create: participantCreateData(row, normalized.baseAmount),
              },
            },
          });
          createdExpenseIds.push(expense.id);
        }

        // Create anomaly records only (no activity logs inside tx)
        const anomalyIds: string[] = [];
        for (const anomaly of validation.anomalies) {
          const created = await tx.anomaly.create({
            data: {
              importSessionId: session.id,
              expenseId: anomaly.existingExpenseId ?? null,
              type: anomaly.type,
              severity: anomaly.severity,
              payload: {
                rowNumber: anomaly.rowNumber,
                message: anomaly.message,
                ...anomaly.payload,
              } as Prisma.InputJsonObject,
            },
          });
          anomalyIds.push(created.id);
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

        return { updated, anomalyIds, report, status };
      },
      {
        timeout: 30000, // 30 seconds — generous timeout for large imports
        maxWait: 10000, // 10 seconds to acquire connection
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
