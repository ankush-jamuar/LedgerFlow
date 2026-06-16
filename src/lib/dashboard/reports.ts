import { AnomalyStatus, ExpenseStatus, ImportStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { calculateGroupBalances } from "@/lib/balances";
import { convertAmount } from "@/lib/currency/exchange";
import {
  decimalToNumber,
  getAccessibleGroupIds,
  roundMoney,
} from "@/lib/dashboard/analytics";

import type {
  CurrencyAmount,
  DashboardAnomalyOverview,
  DashboardRecentImport,
  DashboardReports,
  MonthlyAmount,
  UserAmount,
} from "@/lib/dashboard/types";

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addToMap(map: Map<string, number>, key: string, amount: number) {
  map.set(key, roundMoney((map.get(key) ?? 0) + amount));
}

function mapToMonthlyAmounts(map: Map<string, number>): MonthlyAmount[] {
  return Array.from(map.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, amount]) => ({ month, amount: roundMoney(amount) }));
}

function mapToUserAmounts(map: Map<string, number>, limit = 5): UserAmount[] {
  return Array.from(map.entries())
    .map(([userId, amount]) => ({ userId, amount: roundMoney(amount) }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, limit);
}

function mapToCurrencyAmounts(map: Map<string, number>): CurrencyAmount[] {
  return Array.from(map.entries())
    .map(([currency, amount]) => ({ currency, amount: roundMoney(amount) }))
    .sort((left, right) => right.amount - left.amount);
}

function numberFromReport(reportJson: unknown, key: string): number {
  if (
    typeof reportJson === "object" &&
    reportJson !== null &&
    key in reportJson
  ) {
    const value = (reportJson as Record<string, unknown>)[key];
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  }

  return 0;
}

export function importRowsFromReport(importSession: {
  reportJson: unknown;
  processedCount: number;
  errorCount: number;
  anomalies: unknown[];
}): {
  importedRows: number;
  rejectedRows: number;
  anomalyCount: number;
} {
  const importedRows = numberFromReport(importSession.reportJson, "importedRows");
  const rejectedRows =
    numberFromReport(importSession.reportJson, "rejectedRows") ||
    importSession.errorCount;
  const anomalyCount =
    numberFromReport(importSession.reportJson, "anomalyCount") ||
    importSession.anomalies.length;

  return {
    importedRows:
      importedRows ||
      Math.max(importSession.processedCount - importSession.errorCount, 0),
    rejectedRows,
    anomalyCount,
  };
}

export async function getRecentDashboardImports(
  actorId: string
): Promise<DashboardRecentImport[]> {
  const groupIds = await getAccessibleGroupIds(actorId);
  const imports = await prisma.importSession.findMany({
    where: { groupId: { in: groupIds } },
    include: { anomalies: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return imports.map((importSession) => ({
    id: importSession.id,
    filename: importSession.filename,
    status: importSession.status,
    ...importRowsFromReport(importSession),
    createdAt: importSession.createdAt.toISOString(),
  }));
}

export async function getDashboardAnomalyOverview(
  actorId: string
): Promise<DashboardAnomalyOverview> {
  const groupIds = await getAccessibleGroupIds(actorId);
  const anomalies = await prisma.anomaly.findMany({
    where: { importSession: { groupId: { in: groupIds } } },
    orderBy: { createdAt: "desc" },
  });

  return {
    totalAnomalies: anomalies.length,
    byType: anomalies.reduce<DashboardAnomalyOverview["byType"]>(
      (counts, anomaly) => ({
        ...counts,
        [anomaly.type]: (counts[anomaly.type] ?? 0) + 1,
      }),
      {} as DashboardAnomalyOverview["byType"]
    ),
    bySeverity: anomalies.reduce<DashboardAnomalyOverview["bySeverity"]>(
      (counts, anomaly) => ({
        ...counts,
        [anomaly.severity]: (counts[anomaly.severity] ?? 0) + 1,
      }),
      {} as DashboardAnomalyOverview["bySeverity"]
    ),
    openCount: anomalies.filter((anomaly) => anomaly.status === AnomalyStatus.OPEN)
      .length,
    resolvedCount: anomalies.filter(
      (anomaly) => anomaly.status === AnomalyStatus.RESOLVED
    ).length,
    recentAnomalies: anomalies.slice(0, 20).map((anomaly) => ({
      id: anomaly.id,
      importSessionId: anomaly.importSessionId,
      expenseId: anomaly.expenseId,
      type: anomaly.type,
      severity: anomaly.severity,
      status: anomaly.status,
      payload: anomaly.payload,
      createdAt: anomaly.createdAt.toISOString(),
    })),
  };
}

export async function getDashboardReports(
  actorId: string,
  targetCurrency = "INR"
): Promise<DashboardReports> {
  const groupIds = await getAccessibleGroupIds(actorId);
  const [expenses, settlements, imports, groups] = await Promise.all([
    prisma.expense.findMany({
      where: { groupId: { in: groupIds }, status: ExpenseStatus.ACTIVE },
      include: { group: { select: { currency: true } } },
    }),
    prisma.settlement.findMany({
      where: { groupId: { in: groupIds } },
      include: { group: { select: { currency: true } } },
    }),
    prisma.importSession.findMany({
      where: { groupId: { in: groupIds } },
      include: { anomalies: true },
    }),
    prisma.group.findMany({
      where: { id: { in: groupIds } },
      select: { id: true, currency: true },
    }),
  ]);

  const groupCurrencyById = new Map(
    groups.map((group) => [group.id, group.currency])
  );

  const monthlySpending = new Map<string, number>();
  const monthlySettlements = new Map<string, number>();
  const topPayers = new Map<string, number>();
  const currencyBreakdown = new Map<string, number>();

  for (const expense of expenses) {
    const amount = convertAmount(
      decimalToNumber(expense.baseAmount),
      expense.group.currency,
      targetCurrency
    );
    addToMap(monthlySpending, monthKey(expense.date), amount);
    addToMap(topPayers, expense.paidById, amount);
    
    // Currency breakdown: convert to target currency
    addToMap(currencyBreakdown, expense.originalCurrency, amount);
  }

  for (const settlement of settlements) {
    const amount = convertAmount(
      decimalToNumber(settlement.baseAmount),
      settlement.group.currency,
      targetCurrency
    );
    addToMap(monthlySettlements, monthKey(settlement.settledAt), amount);
    addToMap(currencyBreakdown, settlement.originalCurrency, amount);
  }

  const debtorTotals = new Map<string, number>();
  const creditorTotals = new Map<string, number>();
  for (const groupId of groupIds) {
    const balances = await calculateGroupBalances(actorId, groupId);
    const groupCurrency = groupCurrencyById.get(groupId) ?? targetCurrency;
    for (const member of balances.members) {
      const convertedBalance = convertAmount(
        member.netBalance,
        groupCurrency,
        targetCurrency
      );
      if (convertedBalance < 0) {
        addToMap(debtorTotals, member.userId, Math.abs(convertedBalance));
      }
      if (convertedBalance > 0) {
        addToMap(creditorTotals, member.userId, convertedBalance);
      }
    }
  }

  const byStatus = imports.reduce<Record<ImportStatus, number>>(
    (counts, importSession) => ({
      ...counts,
      [importSession.status]: (counts[importSession.status] ?? 0) + 1,
    }),
    {} as Record<ImportStatus, number>
  );
  const importRows = imports.map(importRowsFromReport);

  return {
    monthlySpending: mapToMonthlyAmounts(monthlySpending),
    monthlySettlements: mapToMonthlyAmounts(monthlySettlements),
    topPayers: mapToUserAmounts(topPayers),
    topDebtors: mapToUserAmounts(debtorTotals),
    topCreditors: mapToUserAmounts(creditorTotals),
    currencyBreakdown: mapToCurrencyAmounts(currencyBreakdown),
    importStatistics: {
      totalImports: imports.length,
      byStatus,
      importedRows: importRows.reduce((total, item) => total + item.importedRows, 0),
      rejectedRows: importRows.reduce((total, item) => total + item.rejectedRows, 0),
      anomalyCount: importRows.reduce((total, item) => total + item.anomalyCount, 0),
    },
  };
}

