import { NextResponse } from "next/server";
import { getDashboardReports } from "@/lib/dashboard";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

export async function GET(req: Request) {
  try {
    const actorId = await requireCurrentUserId();
    const { searchParams } = new URL(req.url);
    const currency = searchParams.get("currency") || "INR";
    const reports = await getDashboardReports(actorId, currency);
    return NextResponse.json(reports);
  } catch (error) {
    return handleServiceError(error);
  }
}

