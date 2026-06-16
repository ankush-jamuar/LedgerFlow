import { NextResponse } from "next/server";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";
import { restoreGroup } from "@/lib/groups";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

export async function POST(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const group = await restoreGroup(actorId, groupId);
    return NextResponse.json({ group });
  } catch (error) {
    return handleServiceError(error);
  }
}
