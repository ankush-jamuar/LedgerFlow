import { NextResponse } from "next/server";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";
import { getSettlementHistory } from "@/lib/settlements";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const settlements = await getSettlementHistory(actorId, groupId);
    return NextResponse.json({ settlements });
  } catch (error) {
    return handleServiceError(error);
  }
}
