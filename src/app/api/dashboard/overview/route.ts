import { NextResponse } from "next/server";
import { getDashboardOverview } from "@/lib/dashboard";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

export async function GET() {
  try {
    const actorId = await requireCurrentUserId();
    const overview = await getDashboardOverview(actorId);
    return NextResponse.json(overview);
  } catch (error) {
    return handleServiceError(error);
  }
}
