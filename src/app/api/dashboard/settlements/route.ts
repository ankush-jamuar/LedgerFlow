import { NextResponse } from "next/server";
import { getSettlementAnalytics } from "@/lib/dashboard";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

export async function GET() {
  try {
    const actorId = await requireCurrentUserId();
    const settlements = await getSettlementAnalytics(actorId);
    return NextResponse.json(settlements);
  } catch (error) {
    return handleServiceError(error);
  }
}
