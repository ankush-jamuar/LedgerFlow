import { ExpenseStatus, GroupRole } from "@prisma/client";
import { notFound } from "@/lib/api/http";
import { prisma } from "@/lib/db/prisma";
import { calculateSplitAllocations } from "@/lib/expenses/splits";
import { requireGroupRole } from "@/lib/memberships/rules";
import { simplifyDebts } from "@/lib/balances/simplify";
import type {
  BalanceSourceExpense,
  BalanceSourceSettlement,
  GroupBalanceResult,
  MemberBalance,
} from "@/lib/balances/types";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function emptyMemberBalance(userId: string): MemberBalance {
  return {
    userId,
    totalPaid: 0,
    totalOwed: 0,
    totalSettledPaid: 0,
    totalSettledReceived: 0,
    netBalance: 0,
    sourceExpenses: [],
    sourceSettlements: [],
  };
}

export async function calculateGroupBalances(
  actorId: string,
  groupId: string
): Promise<GroupBalanceResult> {
  await requireGroupRole(groupId, actorId, GroupRole.MEMBER);

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      memberships: true,
      expenses: {
        where: { status: ExpenseStatus.ACTIVE },
        include: { participants: true },
      },
      settlements: true,
    },
  });

  if (!group) {
    notFound("Group not found");
  }

  const balances = new Map<string, MemberBalance>();
  for (const membership of group.memberships) {
    balances.set(membership.userId, emptyMemberBalance(membership.userId));
  }

  function getBalance(userId: string) {
    const existing = balances.get(userId);
    if (existing) {
      return existing;
    }
    const created = emptyMemberBalance(userId);
    balances.set(userId, created);
    return created;
  }

  for (const expense of group.expenses) {
    const baseAmount = Number(expense.baseAmount.toString());
    const payer = getBalance(expense.paidById);
    payer.totalPaid = roundMoney(payer.totalPaid + baseAmount);

    const allocations = calculateSplitAllocations(
      expense.splitType,
      baseAmount,
      expense.participants.map((participant) => ({
        userId: participant.userId,
        splitValue:
          participant.splitValue === null
            ? undefined
            : Number(participant.splitValue.toString()),
      }))
    );

    for (const allocation of allocations) {
      const participant = getBalance(allocation.userId);
      participant.totalOwed = roundMoney(
        participant.totalOwed + allocation.owedAmount
      );

      const source: BalanceSourceExpense = {
        expenseId: expense.id,
        description: expense.description,
        date: expense.date.toISOString(),
        paidById: expense.paidById,
        participantId: allocation.userId,
        amountPaid: baseAmount,
        amountOwed: allocation.owedAmount,
      };

      participant.sourceExpenses.push(source);
      if (expense.paidById !== allocation.userId) {
        payer.sourceExpenses.push(source);
      }
    }
  }

  for (const settlement of group.settlements) {
    const amount = Number(settlement.baseAmount.toString());
    const source: BalanceSourceSettlement = {
      settlementId: settlement.id,
      payerId: settlement.payerId,
      receiverId: settlement.receiverId,
      amount,
      settledAt: settlement.settledAt.toISOString(),
    };

    const payer = getBalance(settlement.payerId);
    payer.totalSettledPaid = roundMoney(payer.totalSettledPaid + amount);
    payer.sourceSettlements.push(source);

    const receiver = getBalance(settlement.receiverId);
    receiver.totalSettledReceived = roundMoney(
      receiver.totalSettledReceived + amount
    );
    receiver.sourceSettlements.push(source);
  }

  const members = Array.from(balances.values()).map((member) => ({
    ...member,
    totalPaid: roundMoney(member.totalPaid),
    totalOwed: roundMoney(member.totalOwed),
    totalSettledPaid: roundMoney(member.totalSettledPaid),
    totalSettledReceived: roundMoney(member.totalSettledReceived),
    netBalance: roundMoney(
      member.totalPaid -
        member.totalOwed +
        member.totalSettledPaid -
        member.totalSettledReceived
    ),
  }));

  return {
    groupId,
    generatedAt: new Date().toISOString(),
    members,
    netBalances: Object.fromEntries(
      members.map((member) => [member.userId, member.netBalance])
    ),
    totalPaid: roundMoney(
      members.reduce((total, member) => total + member.totalPaid, 0)
    ),
    totalOwed: roundMoney(
      members.reduce((total, member) => total + member.totalOwed, 0)
    ),
    totalSettled: roundMoney(
      group.settlements.reduce(
        (total, settlement) => total + Number(settlement.baseAmount.toString()),
        0
      )
    ),
    whoOwesWhom: simplifyDebts(members),
    metadata: {
      algorithm: "two-pointer-debt-simplification",
      explanation:
        "Balances are computed from active expenses and settlements. Negative net members are matched with positive net members to produce a minimal settlement graph.",
    },
  };
}
