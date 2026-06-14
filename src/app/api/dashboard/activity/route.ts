import { NextResponse } from "next/server";
import {
  dashboardActivityQuerySchema,
  getRecentDashboardActivity,
} from "@/lib/dashboard";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

export async function GET(req: Request) {
  try {
    const actorId = await requireCurrentUserId();
    const { searchParams } = new URL(req.url);
    const query = dashboardActivityQuerySchema.parse({
      limit: searchParams.get("limit") ?? undefined,
    });
    const activity = await getRecentDashboardActivity(actorId, query.limit);
    
    const activities = activity.map((log) => ({
      id: log.id,
      action: log.action,
      actorId: log.actorId,
      targetId: log.entityId,
      groupId: log.groupId,
      payload: log.metadata,
      createdAt: log.createdAt.toISOString(),
      actor: log.actor,
      group: log.group,
    }));

    return NextResponse.json({ activities });
  } catch (error) {
    return handleServiceError(error);
  }
}
