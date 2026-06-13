import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const ACTIVITY_ACTIONS = {
  GROUP_CREATED: "GROUP_CREATED",
  GROUP_UPDATED: "GROUP_UPDATED",
  GROUP_ARCHIVED: "GROUP_ARCHIVED",
  MEMBER_ADDED: "MEMBER_ADDED",
  MEMBER_REMOVED: "MEMBER_REMOVED",
  ROLE_CHANGED: "ROLE_CHANGED",
  EXPENSE_CREATED: "EXPENSE_CREATED",
  EXPENSE_UPDATED: "EXPENSE_UPDATED",
  EXPENSE_DELETED: "EXPENSE_DELETED",
  SETTLEMENT_CREATED: "SETTLEMENT_CREATED",
  SETTLEMENT_UPDATED: "SETTLEMENT_UPDATED",
  IMPORT_STARTED: "IMPORT_STARTED",
  IMPORT_COMPLETED: "IMPORT_COMPLETED",
  IMPORT_FAILED: "IMPORT_FAILED",
  ANOMALY_CREATED: "ANOMALY_CREATED",
  REPORT_GENERATED: "REPORT_GENERATED",
} as const;

export type ActivityAction =
  (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];

interface ActivityInput {
  actorId?: string | null;
  groupId?: string | null;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createActivityLog(input: ActivityInput) {
  return prisma.activityLog.create({
    data: {
      actorId: input.actorId ?? null,
      groupId: input.groupId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? undefined,
    },
  });
}
