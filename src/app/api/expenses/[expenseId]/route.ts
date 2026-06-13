import { NextResponse } from "next/server";
import {
  deleteExpense,
  getExpense,
  updateExpense,
  updateExpenseSchema,
} from "@/lib/expenses";
import {
  handleServiceError,
  readJson,
  requireCurrentUserId,
} from "@/lib/api/http";

interface RouteContext {
  params: Promise<{ expenseId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { expenseId } = await context.params;
    const expense = await getExpense(actorId, expenseId);
    return NextResponse.json({ expense });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { expenseId } = await context.params;
    const parsed = updateExpenseSchema.parse(await readJson(req));
    const expense = await updateExpense(actorId, expenseId, parsed);
    return NextResponse.json({ expense });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { expenseId } = await context.params;
    const expense = await deleteExpense(actorId, expenseId);
    return NextResponse.json({ expense });
  } catch (error) {
    return handleServiceError(error);
  }
}
