import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleServiceError, requireCurrentUserId } from "@/lib/api/http";

export async function GET(req: Request) {
  try {
    // Enforce active session
    await requireCurrentUserId();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json({ users: [] });
    }

    const matchedUsers = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        imageUrl: true,
      },
      take: 10,
    });

    return NextResponse.json({ users: matchedUsers });
  } catch (error) {
    return handleServiceError(error);
  }
}
