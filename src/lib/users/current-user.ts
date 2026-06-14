import type { User, UserPreference } from "@prisma/client";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import {
  syncClerkUser,
  type NormalizedClerkUser,
} from "@/lib/users/clerk-user-sync";

type ActiveClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export interface LocalUserAccount {
  user: User;
  preferences: UserPreference;
}

function normalizeActiveClerkUser(clerkUser: ActiveClerkUser): NormalizedClerkUser {
  return {
    id: clerkUser.id,
    email:
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      null,
    phone:
      clerkUser.primaryPhoneNumber?.phoneNumber ??
      clerkUser.phoneNumbers[0]?.phoneNumber ??
      null,
    username: clerkUser.username,
    imageUrl: clerkUser.imageUrl || null,
  };
}

export async function ensureCurrentLocalUser(): Promise<LocalUserAccount | null> {
  try {
    return await getCurrentLocalUser();
  } catch (error) {
    const err = error as Error & { digest?: string };
    if (err && (err.message?.includes("Dynamic server usage") || err.digest === "DYNAMIC_SERVER_USAGE")) {
      throw error;
    }
    console.error("[CURRENT_USER] Error in ensureCurrentLocalUser:", error);
    return null;
  }
}

export async function getCurrentLocalUser(): Promise<LocalUserAccount | null> {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const localUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
    include: { preferences: true },
  });

  if (!localUser || !localUser.preferences) {
    const synced = await syncClerkUser(normalizeActiveClerkUser(clerkUser));
    return synced;
  }

  return {
    user: localUser,
    preferences: localUser.preferences,
  };
}
