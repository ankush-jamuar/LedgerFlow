import { NextResponse } from "next/server";
import { getDashboardOverview } from "@/lib/dashboard";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

export async function GET(req: Request) {
  try {
    const actorId = await requireCurrentUserId();
    const { searchParams } = new URL(req.url);
    const currency = searchParams.get("currency") || "INR";
    const overview = await getDashboardOverview(actorId, currency);
    return NextResponse.json(overview);
  } catch (error) {
    return handleServiceError(error);
  }
}

