import { NextResponse } from "next/server";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";
import { getMembershipTimeline } from "@/lib/memberships";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const timeline = await getMembershipTimeline(actorId, groupId);
    return NextResponse.json({ timelineEvents: timeline });
  } catch (error) {
    return handleServiceError(error);
  }
}
