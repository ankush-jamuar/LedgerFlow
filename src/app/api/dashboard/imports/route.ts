import { NextResponse } from "next/server";
import { getRecentDashboardImports } from "@/lib/dashboard";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

export async function GET() {
  try {
    const actorId = await requireCurrentUserId();
    const imports = await getRecentDashboardImports(actorId);
    return NextResponse.json({ imports });
  } catch (error) {
    return handleServiceError(error);
  }
}
