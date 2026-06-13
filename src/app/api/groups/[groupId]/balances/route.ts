import { NextResponse } from "next/server";
import { calculateGroupBalances } from "@/lib/balances";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const balances = await calculateGroupBalances(actorId, groupId);
    return NextResponse.json({ balances });
  } catch (error) {
    return handleServiceError(error);
  }
}
