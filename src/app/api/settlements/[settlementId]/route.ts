import { NextResponse } from "next/server";
import {
  updateSettlement,
  updateSettlementSchema,
} from "@/lib/settlements";
import {
  handleServiceError,
  readJson,
  requireCurrentUserId,
} from "@/lib/api/http";

interface RouteContext {
  params: Promise<{ settlementId: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { settlementId } = await context.params;
    const parsed = updateSettlementSchema.parse(await readJson(req));
    const settlement = await updateSettlement(actorId, settlementId, parsed);
    return NextResponse.json({ settlement });
  } catch (error) {
    return handleServiceError(error);
  }
}
