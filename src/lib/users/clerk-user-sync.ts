import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

interface ClerkEmailAddressPayload {
  id?: string | null;
  email_address?: string | null;
}

interface ClerkPhoneNumberPayload {
  id?: string | null;
  phone_number?: string | null;
}

export interface ClerkWebhookUserPayload {
  id?: string | null;
  email_addresses?: ClerkEmailAddressPayload[];
  primary_email_address_id?: string | null;
  phone_numbers?: ClerkPhoneNumberPayload[];
  primary_phone_number_id?: string | null;
  username?: string | null;
  image_url?: string | null;
}

export interface NormalizedClerkUser {
  id: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  imageUrl: string | null;
}

const DEFAULT_USER_PREFERENCES = {
  theme: "dark",
  currency: "INR",
  notificationsEnabled: true,
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function normalizeEmailAddresses(value: unknown): ClerkEmailAddressPayload[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      id: optionalString(item.id),
      email_address: optionalString(item.email_address),
    }))
    .filter((item) => item.email_address !== null);
}

function normalizePhoneNumbers(value: unknown): ClerkPhoneNumberPayload[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      id: optionalString(item.id),
      phone_number: optionalString(item.phone_number),
    }))
    .filter((item) => item.phone_number !== null);
}

function parseClerkWebhookUserPayload(
  payload: unknown
): ClerkWebhookUserPayload | null {
  if (!isRecord(payload)) {
    return null;
  }

  return {
    id: optionalString(payload.id),
    email_addresses: normalizeEmailAddresses(payload.email_addresses),
    primary_email_address_id: optionalString(payload.primary_email_address_id),
    phone_numbers: normalizePhoneNumbers(payload.phone_numbers),
    primary_phone_number_id: optionalString(payload.primary_phone_number_id),
    username: optionalString(payload.username),
    image_url: optionalString(payload.image_url),
  };
}

function findPrimaryEmail(
  emails: ClerkEmailAddressPayload[],
  primaryEmailId: string | null
): string | null {
  const primaryEmail = emails.find((email) => email.id === primaryEmailId);
  return primaryEmail?.email_address ?? emails[0]?.email_address ?? null;
}

function findPrimaryPhone(
  phones: ClerkPhoneNumberPayload[],
  primaryPhoneId: string | null
): string | null {
  const primaryPhone = phones.find((phone) => phone.id === primaryPhoneId);
  return primaryPhone?.phone_number ?? phones[0]?.phone_number ?? null;
}

export function normalizeClerkWebhookUserPayload(
  payload: unknown
): NormalizedClerkUser | null {
  const clerkUser = parseClerkWebhookUserPayload(payload);

  if (!clerkUser?.id) {
    return null;
  }

  return {
    id: clerkUser.id,
    email: findPrimaryEmail(
      clerkUser.email_addresses ?? [],
      clerkUser.primary_email_address_id ?? null
    ),
    phone: findPrimaryPhone(
      clerkUser.phone_numbers ?? [],
      clerkUser.primary_phone_number_id ?? null
    ),
    username: clerkUser.username ?? null,
    imageUrl: clerkUser.image_url ?? null,
  };
}

async function upsertUser(user: NormalizedClerkUser) {
  try {
    return await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        phone: user.phone,
        username: user.username,
        imageUrl: user.imageUrl,
      },
      create: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        username: user.username,
        imageUrl: user.imageUrl,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Under concurrent race, check if the user was just created by another request
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      if (existingUser) {
        return existingUser;
      }

      console.warn(
        `Username collision while syncing Clerk user ${user.id}; retrying without username.`
      );

      return prisma.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          phone: user.phone,
          username: null,
          imageUrl: user.imageUrl,
        },
        create: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          username: null,
          imageUrl: user.imageUrl,
        },
      });
    }

    throw error;
  }
}

export async function syncClerkUser(user: NormalizedClerkUser) {
  const syncedUser = await upsertUser(user);

  try {
    const preferences = await prisma.userPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        ...DEFAULT_USER_PREFERENCES,
      },
    });

    return { user: syncedUser, preferences };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const preferences = await prisma.userPreference.findUnique({
        where: { userId: user.id },
      });
      if (preferences) {
        return { user: syncedUser, preferences };
      }
    }
    throw error;
  }
}

export function getClerkDeletedUserId(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  return optionalString(payload.id);
}

export function logPreservedClerkUserDeletion(clerkUserId: string): void {
  console.info(
    `Clerk user.deleted received for ${clerkUserId}; local LedgerFlow user record preserved for auditability.`
  );
}

export { DEFAULT_USER_PREFERENCES };
