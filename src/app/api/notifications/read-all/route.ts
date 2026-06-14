import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

export async function PATCH() {
  try {
    const actorId = await requireCurrentUserId();

    await prisma.notification.updateMany({
      where: { userId: actorId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleServiceError(error);
  }
}
