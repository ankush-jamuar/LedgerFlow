import { NextResponse } from "next/server";
import { getDashboardAnomalyOverview } from "@/lib/dashboard";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

export async function GET() {
  try {
    const actorId = await requireCurrentUserId();
    const anomalies = await getDashboardAnomalyOverview(actorId);
    return NextResponse.json(anomalies);
  } catch (error) {
    return handleServiceError(error);
  }
}
