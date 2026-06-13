import { z } from "zod";
import { ACTIVITY_ACTIONS } from "@/lib/activity";
import { prisma } from "@/lib/db/prisma";
import { getAccessibleGroupIds } from "@/lib/dashboard/analytics";

export const dashboardActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const DASHBOARD_ACTIVITY_ACTIONS = [
  ACTIVITY_ACTIONS.GROUP_CREATED,
  ACTIVITY_ACTIONS.MEMBER_ADDED,
  ACTIVITY_ACTIONS.EXPENSE_CREATED,
  ACTIVITY_ACTIONS.SETTLEMENT_CREATED,
  ACTIVITY_ACTIONS.IMPORT_STARTED,
  ACTIVITY_ACTIONS.IMPORT_COMPLETED,
  ACTIVITY_ACTIONS.ANOMALY_CREATED,
] as const;

export async function getRecentDashboardActivity(
  actorId: string,
  limit = 20
) {
  const groupIds = await getAccessibleGroupIds(actorId);

  return prisma.activityLog.findMany({
    where: {
      action: { in: [...DASHBOARD_ACTIVITY_ACTIONS] },
      OR: [{ groupId: { in: groupIds } }, { actorId }],
    },
    include: {
      actor: true,
      group: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
