import { NextResponse } from "next/server";
import { getGroupAnalytics } from "@/lib/dashboard";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

export async function GET() {
  try {
    const actorId = await requireCurrentUserId();
    const groups = await getGroupAnalytics(actorId);
    return NextResponse.json(groups);
  } catch (error) {
    return handleServiceError(error);
  }
}
