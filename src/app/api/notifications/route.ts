import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

export async function GET() {
  try {
    const actorId = await requireCurrentUserId();

    const notifications = await prisma.notification.findMany({
      where: { userId: actorId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    return handleServiceError(error);
  }
}
