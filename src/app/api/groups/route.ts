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

export async function GET(req: Request) {
  try {
    const actorId = await requireCurrentUserId();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";
    const groups = await listGroups(actorId, includeArchived);
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
