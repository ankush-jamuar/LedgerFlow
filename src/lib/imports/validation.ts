import {
  AnomalySeverity,
  AnomalyType,
  ExpenseStatus,
  SplitType,
  type GroupMember,
  type User,
} from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { calculateSplitAllocations } from "@/lib/expenses/splits";
import { isMemberActiveOnDate } from "@/lib/memberships/rules";
import type {
  ImportAnomalyDraft,
  ImportValidationResult,
  ParsedImportRow,
  ResolvedParticipant,
  ValidImportExpense,
} from "@/lib/imports/types";

type MemberWithUser = GroupMember & { user: User };

const settlementTerms = [
  "paid back",
  "returned money",
  "settled",
  "reimbursement",
];

const splitTypeSchema = z.enum([
  SplitType.EQUAL,
  SplitType.EXACT,
  SplitType.PERCENTAGE,
  SplitType.SHARES,
]);

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function normalizeDescription(value: string) {
  return normalize(value).replace(/\s+/g, " ");
}

function rowDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toMoney(value: string): number | null {
  const normalized = value.replace(/,/g, "").trim();
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : null;
}

function toCurrency(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
}

function parseDate(value: string): Date | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function splitParticipantCell(value: string): string[] {
  if (value.includes(";")) {
    return value.split(";");
  }
  if (value.includes("|")) {
    return value.split("|");
  }
  return value.split(",");
}

function buildMemberIndex(memberships: MemberWithUser[]) {
  const index = new Map<string, MemberWithUser>();

  for (const membership of memberships) {
    const identifiers = [
      membership.userId,
      membership.user.username,
      membership.user.email,
      membership.user.phone,
    ].filter((value): value is string => Boolean(value));

    for (const identifier of identifiers) {
      index.set(normalize(identifier), membership);
    }
  }

  return index;
}

function resolveMember(
  identifier: string,
  memberIndex: Map<string, MemberWithUser>
): MemberWithUser | null {
  return memberIndex.get(normalize(identifier)) ?? null;
}

function parseParticipants(
  row: ParsedImportRow,
  splitType: SplitType,
  memberIndex: Map<string, MemberWithUser>,
  anomalies: ImportAnomalyDraft[]
): ResolvedParticipant[] {
  const participants: ResolvedParticipant[] = [];
  const seen = new Set<string>();
  const segments = splitParticipantCell(row.participants)
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const separator = segment.includes(":") ? ":" : "=";
    const [rawIdentifier, rawValue] = segment
      .split(separator)
      .map((part) => part.trim());
    const membership = resolveMember(rawIdentifier, memberIndex);

    if (!membership) {
      anomalies.push({
        rowNumber: row.rowNumber,
        type: AnomalyType.UNKNOWN_MEMBER,
        severity: AnomalySeverity.HIGH,
        message: `Participant ${rawIdentifier} was not found in the group`,
        payload: { field: "participants", rawIdentifier, row: row.raw },
      });
      continue;
    }

    if (seen.has(membership.userId)) {
      anomalies.push({
        rowNumber: row.rowNumber,
        type: AnomalyType.CONFLICTING_DUPLICATE,
        severity: AnomalySeverity.MEDIUM,
        message: `Participant ${rawIdentifier} appears more than once`,
        payload: { field: "participants", userId: membership.userId, row: row.raw },
      });
      continue;
    }

    seen.add(membership.userId);

    const participant: ResolvedParticipant = {
      userId: membership.userId,
      rawIdentifier,
    };

    if (splitType !== SplitType.EQUAL) {
      const parsedValue = rawValue === undefined ? Number.NaN : Number(rawValue);
      if (!Number.isFinite(parsedValue)) {
        anomalies.push({
          rowNumber: row.rowNumber,
          type: AnomalyType.CONFLICTING_DUPLICATE,
          severity: AnomalySeverity.HIGH,
          message: `${splitType} participant ${rawIdentifier} requires a numeric split value`,
          payload: {
            field: "participants",
            splitType,
            rawParticipant: segment,
            row: row.raw,
          },
        });
        continue;
      }
      participant.splitValue = parsedValue;
    }

    participants.push(participant);
  }

  return participants;
}

function addAnomaly(
  anomalies: ImportAnomalyDraft[],
  row: ParsedImportRow,
  type: AnomalyType,
  message: string,
  payload: Record<string, unknown>,
  severity: AnomalySeverity = AnomalySeverity.MEDIUM
) {
  anomalies.push({
    rowNumber: row.rowNumber,
    type,
    severity,
    message,
    payload: { ...payload, row: row.raw },
  });
}

function makeRowSignature(row: ValidImportExpense) {
  return [
    rowDateKey(row.date),
    row.paidById,
    row.amount.toFixed(2),
    normalizeDescription(row.description),
  ].join("|");
}

function makeConflictSignature(row: ValidImportExpense) {
  return [
    rowDateKey(row.date),
    row.paidById,
    normalizeDescription(row.description),
  ].join("|");
}

export async function validateImportRows(
  groupId: string,
  rows: ParsedImportRow[]
): Promise<ImportValidationResult> {
  const memberships = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: true },
  });
  const memberIndex = buildMemberIndex(memberships);
  const existingExpenses = await prisma.expense.findMany({
    where: { groupId, status: ExpenseStatus.ACTIVE },
    select: {
      id: true,
      paidById: true,
      description: true,
      date: true,
      originalAmount: true,
      originalCurrency: true,
    },
  });

  const existingExact = new Map<string, string>();
  const existingConflict = new Map<string, { id: string; amount: number; currency: string }>();

  for (const expense of existingExpenses) {
    const amount = Number(expense.originalAmount.toString());
    const exactKey = [
      rowDateKey(expense.date),
      expense.paidById,
      amount.toFixed(2),
      normalizeDescription(expense.description),
    ].join("|");
    const conflictKey = [
      rowDateKey(expense.date),
      expense.paidById,
      normalizeDescription(expense.description),
    ].join("|");
    existingExact.set(exactKey, expense.id);
    existingConflict.set(conflictKey, {
      id: expense.id,
      amount,
      currency: expense.originalCurrency,
    });
  }

  const validRows: ValidImportExpense[] = [];
  const anomalies: ImportAnomalyDraft[] = [];
  const currenciesEncountered = new Set<string>();
  const batchExact = new Map<string, number>();
  const batchConflict = new Map<string, { rowNumber: number; amount: number; currency: string }>();
  let settlementLikeRowCount = 0;

  for (const row of rows) {
    const rowAnomalies: ImportAnomalyDraft[] = [];
    const amount = toMoney(row.amount);
    const currency = row.currency
      ? toCurrency(row.currency)
      : undefined;
    const date = parseDate(row.date);
    const splitTypeResult = splitTypeSchema.safeParse(row.splitType.toUpperCase());
    const payer = resolveMember(row.paidBy, memberIndex);

    if (currency) {
      currenciesEncountered.add(currency);
    } else {
      addAnomaly(
        rowAnomalies,
        row,
        AnomalyType.MISSING_CURRENCY,
        "Currency is missing or invalid",
        { field: "currency", value: row.currency },
        AnomalySeverity.HIGH
      );
    }

    if (amount === null || amount <= 0) {
      addAnomaly(
        rowAnomalies,
        row,
        AnomalyType.NEGATIVE_AMOUNT,
        "Amount must be greater than zero",
        { field: "amount", value: row.amount },
        AnomalySeverity.HIGH
      );
    }

    if (!date || date > new Date()) {
      addAnomaly(
        rowAnomalies,
        row,
        AnomalyType.INVALID_DATE,
        "Date is invalid or in the future",
        { field: "date", value: row.date },
        AnomalySeverity.HIGH
      );
    }

    if (!payer) {
      addAnomaly(
        rowAnomalies,
        row,
        AnomalyType.UNKNOWN_MEMBER,
        `Payer ${row.paidBy} was not found in the group`,
        { field: "paidBy", value: row.paidBy },
        AnomalySeverity.HIGH
      );
    }

    if (!splitTypeResult.success) {
      addAnomaly(
        rowAnomalies,
        row,
        AnomalyType.CONFLICTING_DUPLICATE,
        "Split type must be EQUAL, EXACT, PERCENTAGE, or SHARES",
        { field: "splitType", value: row.splitType },
        AnomalySeverity.HIGH
      );
    }

    if (
      settlementTerms.some((term) =>
        normalizeDescription(row.description).includes(term)
      )
    ) {
      settlementLikeRowCount += 1;
      addAnomaly(
        rowAnomalies,
        row,
        AnomalyType.SETTLEMENT_AS_EXPENSE,
        "Row appears to describe a settlement rather than an expense",
        { field: "description", value: row.description },
        AnomalySeverity.MEDIUM
      );
    }

    if (!date || !payer || !splitTypeResult.success || amount === null || !currency) {
      anomalies.push(...rowAnomalies);
      continue;
    }

    if (!isMemberActiveOnDate(payer, date)) {
      addAnomaly(
        rowAnomalies,
        row,
        AnomalyType.MEMBER_NOT_ACTIVE,
        `Payer ${row.paidBy} was not active on the expense date`,
        { field: "paidBy", userId: payer.userId, date: date.toISOString() },
        AnomalySeverity.HIGH
      );
    }

    const participants = parseParticipants(
      row,
      splitTypeResult.data,
      memberIndex,
      rowAnomalies
    );

    if (participants.length === 0) {
      addAnomaly(
        rowAnomalies,
        row,
        AnomalyType.UNKNOWN_MEMBER,
        "At least one valid participant is required",
        { field: "participants", value: row.participants },
        AnomalySeverity.HIGH
      );
    }

    for (const participant of participants) {
      const membership = memberships.find((item) => item.userId === participant.userId);
      if (membership && !isMemberActiveOnDate(membership, date)) {
        addAnomaly(
          rowAnomalies,
          row,
          AnomalyType.MEMBER_NOT_ACTIVE,
          `Participant ${participant.rawIdentifier} was not active on the expense date`,
          {
            field: "participants",
            userId: participant.userId,
            date: date.toISOString(),
          },
          AnomalySeverity.HIGH
        );
      }
    }

    try {
      calculateSplitAllocations(splitTypeResult.data, amount, participants);
    } catch (error) {
      addAnomaly(
        rowAnomalies,
        row,
        AnomalyType.CONFLICTING_DUPLICATE,
        error instanceof Error ? error.message : "Split validation failed",
        { field: "participants", splitType: splitTypeResult.data },
        AnomalySeverity.HIGH
      );
    }

    const candidate: ValidImportExpense = {
      rowNumber: row.rowNumber,
      raw: row.raw,
      date,
      description: row.description,
      amount,
      currency,
      paidById: payer.userId,
      paidByRaw: row.paidBy,
      splitType: splitTypeResult.data,
      participants,
    };

    const exactSignature = makeRowSignature(candidate);
    const conflictSignature = makeConflictSignature(candidate);
    const existingDuplicateId = existingExact.get(exactSignature);
    const existingConflictMatch = existingConflict.get(conflictSignature);
    const batchDuplicateRow = batchExact.get(exactSignature);
    const batchConflictMatch = batchConflict.get(conflictSignature);

    if (existingDuplicateId || batchDuplicateRow) {
      rowAnomalies.push({
        rowNumber: row.rowNumber,
        type: AnomalyType.DUPLICATE_EXPENSE,
        severity: AnomalySeverity.MEDIUM,
        message: "Duplicate expense detected",
        existingExpenseId: existingDuplicateId,
        payload: {
          duplicateOf: existingDuplicateId
            ? { expenseId: existingDuplicateId }
            : { rowNumber: batchDuplicateRow },
          signature: exactSignature,
          row: row.raw,
        },
      });
    }

    const hasExistingConflict =
      existingConflictMatch &&
      (existingConflictMatch.amount !== amount ||
        existingConflictMatch.currency !== currency);
    const hasBatchConflict =
      batchConflictMatch &&
      (batchConflictMatch.amount !== amount ||
        batchConflictMatch.currency !== currency);

    if (hasExistingConflict || hasBatchConflict) {
      rowAnomalies.push({
        rowNumber: row.rowNumber,
        type: AnomalyType.CONFLICTING_DUPLICATE,
        severity: AnomalySeverity.HIGH,
        message: "Similar expense has conflicting amount or currency",
        existingExpenseId: existingConflictMatch?.id,
        payload: {
          conflictWith: existingConflictMatch
            ? {
              expenseId: existingConflictMatch.id,
              amount: existingConflictMatch.amount,
              currency: existingConflictMatch.currency,
            }
            : batchConflictMatch,
          row: row.raw,
        },
      });
    }

    if (rowAnomalies.length > 0) {
      anomalies.push(...rowAnomalies);
      continue;
    }

    batchExact.set(exactSignature, row.rowNumber);
    batchConflict.set(conflictSignature, {
      rowNumber: row.rowNumber,
      amount,
      currency,
    });
    validRows.push(candidate);
  }

  const rejectedByRow = new Map<number, ImportAnomalyDraft[]>();
  for (const anomaly of anomalies) {
    const existing = rejectedByRow.get(anomaly.rowNumber) ?? [];
    existing.push(anomaly);
    rejectedByRow.set(anomaly.rowNumber, existing);
  }

  return {
    validRows,
    rejectedRows: Array.from(rejectedByRow.entries()).map(
      ([rowNumber, rowAnomalies]) => ({
        rowNumber,
        raw: rows.find((row) => row.rowNumber === rowNumber)?.raw ?? {},
        explanations: rowAnomalies.map((anomaly) => anomaly.message),
        anomalyTypes: rowAnomalies.map((anomaly) => anomaly.type),
      })
    ),
    anomalies,
    currenciesEncountered: Array.from(currenciesEncountered).sort(),
    settlementLikeRowCount,
  };
}
