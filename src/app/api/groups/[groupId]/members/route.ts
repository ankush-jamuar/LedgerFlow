import { NextResponse } from "next/server";
import {
  handleServiceError,
  readJson,
  requireCurrentUserId,
} from "@/lib/api/http";
import { addMember, addMemberSchema, listMembers } from "@/lib/memberships";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const members = await listMembers(actorId, groupId);
    return NextResponse.json({ members });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const parsed = addMemberSchema.parse(await readJson(req));
    const member = await addMember(actorId, groupId, parsed);
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    return handleServiceError(error);
  }
}
