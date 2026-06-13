import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ensureCurrentLocalUser } from "@/lib/users/current-user";
import { userPreferenceUpdateSchema } from "@/validations/user-preferences";

export async function GET() {
  const account = await ensureCurrentLocalUser();

  if (!account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  return NextResponse.json({ preferences: account.preferences });
}

export async function PATCH(req: Request) {
  const account = await ensureCurrentLocalUser();

  if (!account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body: unknown = await req.json();
  const parsed = userPreferenceUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid preference payload",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const preferences = await prisma.userPreference.update({
    where: { userId: account.user.id },
    data: parsed.data,
  });

  return NextResponse.json({ preferences });
}
