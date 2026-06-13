import { GroupRole, Prisma } from "@prisma/client";
import { ACTIVITY_ACTIONS, createActivityLog } from "@/lib/activity";
import { badRequest, notFound } from "@/lib/api/http";
import { prisma } from "@/lib/db/prisma";
import { assertGroupIsOpen } from "@/lib/groups/service";
import { requireActiveMembership, requireGroupRole } from "@/lib/memberships/rules";
import type {
  CreateSettlementInput,
  UpdateSettlementInput,
} from "@/lib/settlements/validation";

const settlementInclude = {
  payer: true,
  receiver: true,
  group: true,
} satisfies Prisma.SettlementInclude;

function toMoneyDecimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}

function calculateBaseAmount(originalAmount: number, exchangeRate: number) {
  return Math.round(originalAmount * exchangeRate * 100) / 100;
}

async function validateSettlementMembers(
  groupId: string,
  payerId: string,
  receiverId: string
) {
  if (payerId === receiverId) {
    badRequest("Payer and receiver must be different users");
  }

  await requireActiveMembership(groupId, payerId);
  await requireActiveMembership(groupId, receiverId);
}

export async function listSettlements(actorId: string, groupId: string) {
  await requireGroupRole(groupId, actorId, GroupRole.MEMBER);

  return prisma.settlement.findMany({
    where: { groupId },
    include: settlementInclude,
    orderBy: { settledAt: "desc" },
  });
}

export async function getSettlementHistory(actorId: string, groupId: string) {
  await requireGroupRole(groupId, actorId, GroupRole.MEMBER);

  return prisma.settlement.findMany({
    where: { groupId },
    include: settlementInclude,
    orderBy: [{ settledAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function createSettlement(
  actorId: string,
  input: CreateSettlementInput
) {
  await assertGroupIsOpen(input.groupId);
  await requireGroupRole(input.groupId, actorId, GroupRole.MEMBER);
  await validateSettlementMembers(input.groupId, input.payerId, input.receiverId);

  const baseAmount = calculateBaseAmount(input.originalAmount, input.exchangeRate);

  const settlement = await prisma.settlement.create({
    data: {
      groupId: input.groupId,
      payerId: input.payerId,
      receiverId: input.receiverId,
      note: input.note ?? null,
      settledAt: input.settledAt,
      originalAmount: toMoneyDecimal(input.originalAmount),
      originalCurrency: input.originalCurrency,
      exchangeRate: new Prisma.Decimal(input.exchangeRate.toFixed(6)),
      baseAmount: toMoneyDecimal(baseAmount),
    },
    include: settlementInclude,
  });

  await createActivityLog({
    actorId,
    groupId: input.groupId,
    action: ACTIVITY_ACTIONS.SETTLEMENT_CREATED,
    entityType: "Settlement",
    entityId: settlement.id,
    metadata: {
      payerId: input.payerId,
      receiverId: input.receiverId,
      baseAmount,
    },
  });

  return settlement;
}

export async function updateSettlement(
  actorId: string,
  settlementId: string,
  input: UpdateSettlementInput
) {
  const existing = await prisma.settlement.findUnique({
    where: { id: settlementId },
    include: settlementInclude,
  });

  if (!existing) {
    notFound("Settlement not found");
  }

  await assertGroupIsOpen(existing.groupId);
  await requireGroupRole(existing.groupId, actorId, GroupRole.ADMIN);
  await validateSettlementMembers(
    existing.groupId,
    existing.payerId,
    existing.receiverId
  );

  const originalAmount =
    input.originalAmount ?? Number(existing.originalAmount.toString());
  const exchangeRate =
    input.exchangeRate ?? Number(existing.exchangeRate.toString());
  const baseAmount = calculateBaseAmount(originalAmount, exchangeRate);

  const settlement = await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      note: input.note,
      settledAt: input.settledAt,
      originalAmount: toMoneyDecimal(originalAmount),
      originalCurrency: input.originalCurrency ?? existing.originalCurrency,
      exchangeRate: new Prisma.Decimal(exchangeRate.toFixed(6)),
      baseAmount: toMoneyDecimal(baseAmount),
    },
    include: settlementInclude,
  });

  await createActivityLog({
    actorId,
    groupId: existing.groupId,
    action: ACTIVITY_ACTIONS.SETTLEMENT_UPDATED,
    entityType: "Settlement",
    entityId: settlementId,
    metadata: { baseAmount },
  });

  return settlement;
}
