import { NextResponse } from "next/server";
import {
  dashboardActivityQuerySchema,
  getRecentDashboardActivity,
} from "@/lib/dashboard";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

export async function GET(req: Request) {
  try {
    const actorId = await requireCurrentUserId();
    const { searchParams } = new URL(req.url);
    const query = dashboardActivityQuerySchema.parse({
      limit: searchParams.get("limit") ?? undefined,
    });
    const activity = await getRecentDashboardActivity(actorId, query.limit);
    return NextResponse.json({ activity });
  } catch (error) {
    return handleServiceError(error);
  }
}
