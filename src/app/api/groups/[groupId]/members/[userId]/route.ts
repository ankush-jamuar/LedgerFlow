import { NextResponse } from "next/server";
import {
  handleServiceError,
  readJson,
  requireCurrentUserId,
} from "@/lib/api/http";
import {
  changeMemberRole,
  changeRoleSchema,
  removeMember,
} from "@/lib/memberships";

interface RouteContext {
  params: Promise<{ groupId: string; userId: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId, userId } = await context.params;
    const parsed = changeRoleSchema.parse(await readJson(req));
    const member = await changeMemberRole(actorId, groupId, userId, parsed);
    return NextResponse.json({ member });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId, userId } = await context.params;
    const member = await removeMember(actorId, groupId, userId);
    return NextResponse.json({ member });
  } catch (error) {
    return handleServiceError(error);
  }
}
