import { prisma } from "@/lib/db/prisma";
import { calculateGroupBalances } from "@/lib/balances";
import type {
  DashboardExpenseAnalytics,
  DashboardExpenseSummary,
  DashboardGroupAnalytics,
  DashboardSettlementAnalytics,
} from "@/lib/dashboard/types";

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function decimalToNumber(value: { toString(): string }): number {
  return Number(value.toString());
}

export async function getAccessibleGroupIds(actorId: string): Promise<string[]> {
  const memberships = await prisma.groupMember.findMany({
    where: { userId: actorId, isActive: true },
    select: { groupId: true },
  });

  return memberships.map(
    (membership: { groupId: string }) => membership.groupId
  );
}

export function currentMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, next };
}

export function lastMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const next = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start, next };
}

function expenseSummary(expense: {
  id: string;
  groupId: string;
  description: string;
  baseAmount: { toString(): string };
  originalCurrency: string;
  date: Date;
}): DashboardExpenseSummary {
  return {
    id: expense.id,
    groupId: expense.groupId,
    description: expense.description,
    amount: roundMoney(decimalToNumber(expense.baseAmount)),
    currency: expense.originalCurrency,
    date: expense.date.toISOString(),
  };
}

export async function calculateAccessibleOutstandingBalance(
  actorId: string,
  groupIds: string[]
): Promise<number> {
  let outstanding = 0;

  for (const groupId of groupIds) {
    try {
      const balances = await calculateGroupBalances(actorId, groupId);
      const member = balances.members.find((m) => m.userId === actorId);
      if (member) {
        outstanding += member.netBalance;
      }
    } catch (error) {
      console.error(`Failed to calculate balance for group ${groupId}`, error);
    }
  }

  return roundMoney(outstanding);
}

export async function getGroupAnalytics(
  actorId: string
): Promise<DashboardGroupAnalytics> {
  const groupIds = await getAccessibleGroupIds(actorId);
  const groups = await prisma.group.findMany({
    where: { id: { in: groupIds } },
    include: {
      _count: {
        select: { memberships: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalMembers = groups.reduce(
    (total: number, group: any) =>
      total + group._count.memberships,
    0
  );
  const largestGroup =
    groups.length === 0
      ? null
      : groups.reduce(
        (
          largest: typeof groups[number],
          group: typeof groups[number]
        ) =>
          group._count.memberships > largest._count.memberships
            ? group
            : largest
      );
  const newestGroup = groups[0] ?? null;

  return {
    totalGroups: groups.length,
    activeGroups: groups.filter(
      (group: typeof groups[number]) => !group.isArchived
    ).length,
    averageMembersPerGroup:
      groups.length === 0 ? 0 : roundMoney(totalMembers / groups.length),
    largestGroup: largestGroup
      ? {
        id: largestGroup.id,
        name: largestGroup.name,
        memberCount: largestGroup._count.memberships,
      }
      : null,
    newestGroup: newestGroup
      ? {
        id: newestGroup.id,
        name: newestGroup.name,
        createdAt: newestGroup.createdAt.toISOString(),
      }
      : null,
    archivedGroups: groups.filter(
      (group: typeof groups[number]) => group.isArchived
    ).length,
  };
}

export async function getExpenseAnalytics(
  actorId: string
): Promise<DashboardExpenseAnalytics> {
  const groupIds = await getAccessibleGroupIds(actorId);
  const thisMonth = currentMonthRange();
  const lastMonth = lastMonthRange();
  const expenses = await prisma.expense.findMany({
    where: { groupId: { in: groupIds }, status: "ACTIVE" },
    orderBy: { date: "desc" },
  });

  const totalExpenseAmount = roundMoney(
    expenses.reduce(
      (total, expense) => total + decimalToNumber(expense.baseAmount),
      0
    )
  );
  const sortedByAmount = [...expenses].sort(
    (left, right) =>
      decimalToNumber(right.baseAmount) - decimalToNumber(left.baseAmount)
  );

  return {
    totalExpenses: expenses.length,
    totalExpenseAmount,
    averageExpenseAmount:
      expenses.length === 0
        ? 0
        : roundMoney(totalExpenseAmount / expenses.length),
    highestExpense:
      sortedByAmount.length > 0 ? expenseSummary(sortedByAmount[0]) : null,
    lowestExpense:
      sortedByAmount.length > 0
        ? expenseSummary(sortedByAmount[sortedByAmount.length - 1])
        : null,
    expensesThisMonth: expenses.filter(
      (expense) => expense.date >= thisMonth.start && expense.date < thisMonth.next
    ).length,
    expensesLastMonth: expenses.filter(
      (expense) => expense.date >= lastMonth.start && expense.date < lastMonth.next
    ).length,
  };
}

export async function getSettlementAnalytics(
  actorId: string
): Promise<DashboardSettlementAnalytics> {
  const groupIds = await getAccessibleGroupIds(actorId);
  const thisMonth = currentMonthRange();
  const lastMonth = lastMonthRange();
  const settlements = await prisma.settlement.findMany({
    where: { groupId: { in: groupIds } },
    orderBy: { settledAt: "desc" },
  });
  const totalSettlementAmount = roundMoney(
    settlements.reduce(
      (total, settlement) => total + decimalToNumber(settlement.baseAmount),
      0
    )
  );

  return {
    totalSettlements: settlements.length,
    totalSettlementAmount,
    averageSettlementAmount:
      settlements.length === 0
        ? 0
        : roundMoney(totalSettlementAmount / settlements.length),
    settlementsThisMonth: settlements.filter(
      (settlement) =>
        settlement.settledAt >= thisMonth.start &&
        settlement.settledAt < thisMonth.next
    ).length,
    settlementsLastMonth: settlements.filter(
      (settlement) =>
        settlement.settledAt >= lastMonth.start &&
        settlement.settledAt < lastMonth.next
    ).length,
  };
}
