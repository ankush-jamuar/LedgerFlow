import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleServiceError, readJsonObject, requireCurrentUserId } from "@/lib/api/http";
import { requireGroupRole } from "@/lib/memberships/rules";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    await requireGroupRole(groupId, actorId, "MEMBER");

    const messages = await prisma.message.findMany({
      where: { groupId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    await requireGroupRole(groupId, actorId, "MEMBER");

    const body = await readJsonObject(req);
    const text = String(body.body || "").trim();

    if (!text) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        groupId,
        senderId: actorId,
        body: text,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            imageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return handleServiceError(error);
  }
}
