import { NextResponse } from "next/server";
import { getImportSession } from "@/lib/imports";
import {
  handleServiceError,
  requireCurrentUserId,
} from "@/lib/api/http";

interface RouteContext {
  params: Promise<{ importSessionId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { importSessionId } = await context.params;
    const importSession = await getImportSession(actorId, importSessionId);
    return NextResponse.json({ importSession });
  } catch (error) {
    return handleServiceError(error);
  }
}
