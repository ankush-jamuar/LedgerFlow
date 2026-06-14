import { ExpenseStatus, GroupRole, Prisma, SplitType } from "@prisma/client";
import { ACTIVITY_ACTIONS, createActivityLog } from "@/lib/activity";
import { badRequest, notFound } from "@/lib/api/http";
import { prisma } from "@/lib/db/prisma";
import { createDbNotification } from "@/lib/notifications/service";
import { assertGroupIsOpen } from "@/lib/groups/service";
import {
  isMemberActiveOnDate,
  requireGroupRole,
} from "@/lib/memberships/rules";
import { calculateSplitAllocations } from "@/lib/expenses/splits";
import type {
  CreateExpenseInput,
  ExpenseParticipantInput,
  UpdateExpenseInput,
} from "@/lib/expenses/validation";

const expenseInclude = {
  participants: { include: { user: true } },
  paidBy: true,
  group: true,
} satisfies Prisma.ExpenseInclude;

function toDecimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}

function calculateBaseAmount(originalAmount: number, exchangeRate: number) {
  return Math.round(originalAmount * exchangeRate * 100) / 100;
}

async function validateExpenseMemberships(
  groupId: string,
  paidById: string,
  date: Date,
  participants: ExpenseParticipantInput[]
) {
  const userIds = Array.from(
    new Set([paidById, ...participants.map((participant) => participant.userId)])
  );

  const memberships = await prisma.groupMember.findMany({
    where: { groupId, userId: { in: userIds } },
  });

  for (const userId of userIds) {
    const membership = memberships.find((item) => item.userId === userId);
    if (!membership || !isMemberActiveOnDate(membership, date)) {
      badRequest(`User ${userId} was not an active member on the expense date`);
    }
  }
}

export async function listExpenses(actorId: string, groupId: string) {
  await requireGroupRole(groupId, actorId, GroupRole.MEMBER);

  return prisma.expense.findMany({
    where: { groupId, status: ExpenseStatus.ACTIVE },
    include: expenseInclude,
    orderBy: { date: "desc" },
  });
}

export async function getExpense(actorId: string, expenseId: string) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: expenseInclude,
  });

  if (!expense) {
    notFound("Expense not found");
  }

  await requireGroupRole(expense.groupId, actorId, GroupRole.MEMBER);
  return expense;
}

export async function createExpense(actorId: string, input: CreateExpenseInput) {
  await assertGroupIsOpen(input.groupId);
  await requireGroupRole(input.groupId, actorId, GroupRole.MEMBER);
  await validateExpenseMemberships(
    input.groupId,
    input.paidById,
    input.date,
    input.participants
  );

  const baseAmount = calculateBaseAmount(input.originalAmount, input.exchangeRate);
  const allocations = calculateSplitAllocations(
    input.splitType,
    baseAmount,
    input.participants
  );

  const expense = await prisma.expense.create({
    data: {
      groupId: input.groupId,
      paidById: input.paidById,
      splitType: input.splitType,
      description: input.description,
      date: input.date,
      receiptUrl: input.receiptUrl ?? null,
      originalAmount: toDecimal(input.originalAmount),
      originalCurrency: input.originalCurrency,
      exchangeRate: new Prisma.Decimal(input.exchangeRate.toFixed(6)),
      baseAmount: toDecimal(baseAmount),
      participants: {
        create: allocations.map((allocation) => ({
          userId: allocation.userId,
          splitValue:
            allocation.rawSplitValue === null
              ? null
              : toDecimal(allocation.rawSplitValue),
          metadata: {
            calculatedOwedAmount: allocation.owedAmount,
          },
        })),
      },
    },
    include: expenseInclude,
  });

  await createActivityLog({
    actorId,
    groupId: input.groupId,
    action: ACTIVITY_ACTIONS.EXPENSE_CREATED,
    entityType: "Expense",
    entityId: expense.id,
    metadata: { description: expense.description, baseAmount },
  });

  const payerName = expense.paidBy?.username || expense.paidBy?.email?.split("@")[0] || "Someone";
  const otherMembers = await prisma.groupMember.findMany({
    where: {
      groupId: input.groupId,
      isActive: true,
      userId: { not: input.paidById },
    },
  });

  const groupName = expense.group?.name || "Group";
  for (const member of otherMembers) {
    await createDbNotification({
      userId: member.userId,
      type: "EXPENSE_CREATED",
      title: "New Expense Added",
      message: `${payerName} added "${expense.description}" of ${expense.originalCurrency} ${expense.originalAmount} in "${groupName}".`,
    });
  }

  return expense;
}

export async function updateExpense(
  actorId: string,
  expenseId: string,
  input: UpdateExpenseInput
) {
  const existing = await getExpense(actorId, expenseId);
  await assertGroupIsOpen(existing.groupId);
  await requireGroupRole(existing.groupId, actorId, GroupRole.ADMIN);

  const nextSplitType = input.splitType ?? existing.splitType;
  const nextAmount =
    input.originalAmount ?? Number(existing.originalAmount.toString());
  const nextExchangeRate =
    input.exchangeRate ?? Number(existing.exchangeRate.toString());
  const nextDate = input.date ?? existing.date;
  const nextPaidById = input.paidById ?? existing.paidById;
  const nextParticipants =
    input.participants ??
    existing.participants.map((participant) => ({
      userId: participant.userId,
      splitValue:
        nextSplitType === SplitType.EQUAL || participant.splitValue === null
          ? undefined
          : Number(participant.splitValue.toString()),
    }));

  await validateExpenseMemberships(
    existing.groupId,
    nextPaidById,
    nextDate,
    nextParticipants
  );

  const baseAmount = calculateBaseAmount(nextAmount, nextExchangeRate);
  const allocations = calculateSplitAllocations(
    nextSplitType,
    baseAmount,
    nextParticipants
  );

  const updated = await prisma.$transaction(async (tx) => {
    await tx.expenseParticipant.deleteMany({ where: { expenseId } });

    return tx.expense.update({
      where: { id: expenseId },
      data: {
        paidById: nextPaidById,
        splitType: nextSplitType,
        description: input.description,
        date: nextDate,
        receiptUrl: input.receiptUrl,
        originalAmount: toDecimal(nextAmount),
        originalCurrency: input.originalCurrency ?? existing.originalCurrency,
        exchangeRate: new Prisma.Decimal(nextExchangeRate.toFixed(6)),
        baseAmount: toDecimal(baseAmount),
        participants: {
          create: allocations.map((allocation) => ({
            userId: allocation.userId,
            splitValue:
              allocation.rawSplitValue === null
                ? null
                : toDecimal(allocation.rawSplitValue),
            metadata: { calculatedOwedAmount: allocation.owedAmount },
          })),
        },
      },
      include: expenseInclude,
    });
  });

  await createActivityLog({
    actorId,
    groupId: existing.groupId,
    action: ACTIVITY_ACTIONS.EXPENSE_UPDATED,
    entityType: "Expense",
    entityId: expenseId,
    metadata: { baseAmount },
  });

  return updated;
}

export async function deleteExpense(actorId: string, expenseId: string) {
  const expense = await getExpense(actorId, expenseId);
  await assertGroupIsOpen(expense.groupId);
  await requireGroupRole(expense.groupId, actorId, GroupRole.ADMIN);

  const deleted = await prisma.expense.update({
    where: { id: expenseId },
    data: { status: ExpenseStatus.ARCHIVED },
    include: expenseInclude,
  });

  await createActivityLog({
    actorId,
    groupId: expense.groupId,
    action: ACTIVITY_ACTIONS.EXPENSE_DELETED,
    entityType: "Expense",
    entityId: expenseId,
  });

  return deleted;
}
