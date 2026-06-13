import { NextResponse } from "next/server";
import {
  createSettlement,
  createSettlementSchema,
  listSettlements,
} from "@/lib/settlements";
import {
  handleServiceError,
  readJsonObject,
  requireCurrentUserId,
} from "@/lib/api/http";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const settlements = await listSettlements(actorId, groupId);
    return NextResponse.json({ settlements });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const parsed = createSettlementSchema.parse({
      ...(await readJsonObject(req)),
      groupId,
    });
    const settlement = await createSettlement(actorId, parsed);
    return NextResponse.json({ settlement }, { status: 201 });
  } catch (error) {
    return handleServiceError(error);
  }
}
