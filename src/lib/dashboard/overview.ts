import { prisma } from "@/lib/db/prisma";
import { convertAmount } from "@/lib/currency/exchange";
import {
  calculateAccessibleOutstandingBalance,
  decimalToNumber,
  getAccessibleGroupIds,
  roundMoney,
} from "@/lib/dashboard/analytics";
import type { DashboardOverview } from "@/lib/dashboard/types";

const OVERVIEW_BASE_CURRENCY = "INR";

export async function getDashboardOverview(
  actorId: string
): Promise<DashboardOverview> {
  const groupIds = await getAccessibleGroupIds(actorId);
  const [
    groups,
    totalExpenses,
    activeExpenses,
    expenses,
    settlements,
    totalImportSessions,
    totalAnomalies,
  ] = await Promise.all([
    prisma.group.findMany({
      where: { id: { in: groupIds } },
      select: { id: true, isArchived: true },
    }),
    prisma.expense.count({ where: { groupId: { in: groupIds } } }),
    prisma.expense.count({
      where: { groupId: { in: groupIds }, status: "ACTIVE" },
    }),
    prisma.expense.findMany({
      where: { groupId: { in: groupIds }, status: "ACTIVE" },
      select: {
        baseAmount: true,
        originalCurrency: true,
        group: { select: { currency: true } },
      },
    }),
    prisma.settlement.findMany({
      where: { groupId: { in: groupIds } },
      select: {
        baseAmount: true,
        originalCurrency: true,
        group: { select: { currency: true } },
      },
    }),
    prisma.importSession.count({ where: { groupId: { in: groupIds } } }),
    prisma.anomaly.count({
      where: { importSession: { groupId: { in: groupIds } } },
    }),
  ]);

  const totalExpenseAmount = expenses.reduce(
    (total, expense) =>
      total +
      convertAmount(
        decimalToNumber(expense.baseAmount),
        expense.group.currency,
        OVERVIEW_BASE_CURRENCY
      ),
    0
  );
  const totalSettlementAmount = settlements.reduce(
    (total, settlement) =>
      total +
      convertAmount(
        decimalToNumber(settlement.baseAmount),
        settlement.group.currency,
        OVERVIEW_BASE_CURRENCY
      ),
    0
  );
  const currenciesUsed = Array.from(
    new Set([
      ...expenses.map((expense) => expense.originalCurrency),
      ...settlements.map((settlement) => settlement.originalCurrency),
    ])
  ).sort();

  return {
    totalGroups: groups.length,
    activeGroups: groups.filter((group) => !group.isArchived).length,
    totalExpenses,
    activeExpenses,
    totalSettlements: settlements.length,
    totalImportSessions,
    totalAnomalies,
    outstandingBalance: await calculateAccessibleOutstandingBalance(
      actorId,
      groupIds,
      OVERVIEW_BASE_CURRENCY
    ),
    totalAmountTracked: roundMoney(totalExpenseAmount + totalSettlementAmount),
    currenciesUsed,
    generatedAt: new Date().toISOString(),
  };
}
