import { NextResponse } from "next/server";
import { getExpenseAnalytics } from "@/lib/dashboard";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

export async function GET() {
  try {
    const actorId = await requireCurrentUserId();
    const expenses = await getExpenseAnalytics(actorId);
    return NextResponse.json(expenses);
  } catch (error) {
    return handleServiceError(error);
  }
}
