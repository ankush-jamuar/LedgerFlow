import { NextResponse } from "next/server";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";
import { deleteGroupPermanent } from "@/lib/groups";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const result = await deleteGroupPermanent(actorId, groupId);
    return NextResponse.json(result);
  } catch (error) {
    return handleServiceError(error);
  }
}
