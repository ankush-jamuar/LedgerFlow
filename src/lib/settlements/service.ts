import { GroupRole, Prisma } from "@prisma/client";
import { ACTIVITY_ACTIONS, createActivityLog } from "@/lib/activity";
import { badRequest, notFound } from "@/lib/api/http";
import { prisma } from "@/lib/db/prisma";
import { createDbNotification } from "@/lib/notifications/service";
import { assertGroupIsOpen } from "@/lib/groups/service";
import { normalizeToGroupBase } from "@/lib/currency/exchange";
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

function toRateDecimal(value: number) {
  return new Prisma.Decimal(value.toFixed(6));
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
  const group = await assertGroupIsOpen(input.groupId);
  await requireGroupRole(input.groupId, actorId, GroupRole.MEMBER);
  await validateSettlementMembers(input.groupId, input.payerId, input.receiverId);

  const normalized = normalizeToGroupBase(
    input.originalAmount,
    input.originalCurrency,
    group.currency
  );

  const settlement = await prisma.settlement.create({
    data: {
      groupId: input.groupId,
      payerId: input.payerId,
      receiverId: input.receiverId,
      note: input.note ?? null,
      settledAt: input.settledAt,
      originalAmount: toMoneyDecimal(normalized.originalAmount),
      originalCurrency: normalized.originalCurrency,
      exchangeRate: toRateDecimal(normalized.exchangeRate),
      baseAmount: toMoneyDecimal(normalized.baseAmount),
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
      baseAmount: normalized.baseAmount,
    },
  });

  const payerName = settlement.payer?.username || settlement.payer?.email?.split("@")[0] || "Someone";
  const receiverName = settlement.receiver?.username || settlement.receiver?.email?.split("@")[0] || "Someone";
  try {
    await prisma.message.create({
      data: {
        groupId: input.groupId,
        senderId: actorId,
        body: `🤝 Settlement recorded: ${payerName} paid ${receiverName} ${settlement.originalCurrency} ${settlement.originalAmount}`,
      },
    });
  } catch (chatErr) {
    console.error("Failed to post system chat message for settlement creation", chatErr);
  }
  const groupName = settlement.group?.name || "Group";
  await createDbNotification({
    userId: input.receiverId,
    type: "SETTLEMENT_CREATED",
    title: "Payment Received",
    message: `${payerName} recorded a settlement to you of ${settlement.originalCurrency} ${settlement.originalAmount} in "${groupName}".`,
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

  const group = await assertGroupIsOpen(existing.groupId);
  await requireGroupRole(existing.groupId, actorId, GroupRole.ADMIN);
  await validateSettlementMembers(
    existing.groupId,
    existing.payerId,
    existing.receiverId
  );

  const originalAmount =
    input.originalAmount ?? Number(existing.originalAmount.toString());
  const originalCurrency =
    input.originalCurrency ?? existing.originalCurrency;
  const normalized = normalizeToGroupBase(
    originalAmount,
    originalCurrency,
    group.currency
  );

  const settlement = await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      note: input.note,
      settledAt: input.settledAt,
      originalAmount: toMoneyDecimal(normalized.originalAmount),
      originalCurrency: normalized.originalCurrency,
      exchangeRate: toRateDecimal(normalized.exchangeRate),
      baseAmount: toMoneyDecimal(normalized.baseAmount),
    },
    include: settlementInclude,
  });

  await createActivityLog({
    actorId,
    groupId: existing.groupId,
    action: ACTIVITY_ACTIONS.SETTLEMENT_UPDATED,
    entityType: "Settlement",
    entityId: settlementId,
    metadata: { baseAmount: normalized.baseAmount },
  });

  return settlement;
}
