import { NextResponse } from "next/server";
import { getDashboardReports } from "@/lib/dashboard";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

export async function GET() {
  try {
    const actorId = await requireCurrentUserId();
    const reports = await getDashboardReports(actorId);
    return NextResponse.json(reports);
  } catch (error) {
    return handleServiceError(error);
  }
}
