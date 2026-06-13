import { NextResponse } from "next/server";
import {
  createExpense,
  createExpenseSchema,
  listExpenses,
} from "@/lib/expenses";
import {
  handleServiceError,
  readJsonObject,
  requireCurrentUserId,
} from "@/lib/api/http";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const expenses = await listExpenses(actorId, groupId);
    return NextResponse.json({ expenses });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const parsed = createExpenseSchema.parse({
      ...(await readJsonObject(req)),
      groupId,
    });
    const expense = await createExpense(actorId, parsed);
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return handleServiceError(error);
  }
}
