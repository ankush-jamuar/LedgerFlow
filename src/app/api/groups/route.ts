import { NextResponse } from "next/server";
import {
  handleServiceError,
  readJson,
  requireCurrentUserId,
} from "@/lib/api/http";
import {
  createGroup,
  createGroupSchema,
  listGroups,
} from "@/lib/groups";

export async function GET() {
  try {
    const actorId = await requireCurrentUserId();
    const groups = await listGroups(actorId);
    return NextResponse.json({ groups });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function POST(req: Request) {
  try {
    const actorId = await requireCurrentUserId();
    const parsed = createGroupSchema.parse(await readJson(req));
    const group = await createGroup(actorId, parsed);
    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    return handleServiceError(error);
  }
}
