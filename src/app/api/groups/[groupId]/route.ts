import { NextResponse } from "next/server";
import {
  handleServiceError,
  readJson,
  requireCurrentUserId,
} from "@/lib/api/http";
import { archiveGroup, getGroup, updateGroup, updateGroupSchema } from "@/lib/groups";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const group = await getGroup(actorId, groupId);
    return NextResponse.json({ group });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const parsed = updateGroupSchema.parse(await readJson(req));
    const group = await updateGroup(actorId, groupId, parsed);
    return NextResponse.json({ group });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const group = await archiveGroup(actorId, groupId);
    return NextResponse.json({ group });
  } catch (error) {
    return handleServiceError(error);
  }
}
