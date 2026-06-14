import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { id } = await context.params;

    const notification = await prisma.notification.update({
      where: { id, userId: actorId },
      data: { isRead: true },
    });

    return NextResponse.json({ notification });
  } catch (error) {
    return handleServiceError(error);
  }
}
