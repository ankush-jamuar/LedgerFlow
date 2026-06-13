import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

/**
 * Clerk Webhook Sync Route
 * Verifies signature using svix and handles user lifecycle events to maintain database parity.
 * Clerk is the source of truth for identity; we replicate attributes here to satisfy relational schemas.
 */
export async function POST(req: Request) {
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix signatures", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Error: CLERK_WEBHOOK_SECRET is not configured on the server", {
      status: 500,
    });
  }

  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying Clerk webhook signature:", err);
    return new Response("Error: Signature verification failed", {
      status: 400,
    });
  }

  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id: clerkId, email_addresses, phone_numbers, username, image_url } = evt.data;

    if (!clerkId) {
      return new Response("Error: Missing user ID in event data", {
        status: 400,
      });
    }

    // Clerk supports multiple emails/phone numbers. Extract primary or first if available.
    const email = email_addresses && email_addresses.length > 0
      ? email_addresses[0].email_address
      : null;

    const phone = phone_numbers && phone_numbers.length > 0
      ? phone_numbers[0].phone_number
      : null;

    const normalizedUsername = username || null;
    const imageUrl = image_url || null;

    try {
      await prisma.$transaction(async (tx) => {
        // Upsert User profile attributes
        await tx.user.upsert({
          where: { id: clerkId },
          update: {
            email,
            phone,
            username: normalizedUsername,
            imageUrl,
          },
          create: {
            id: clerkId,
            email,
            phone,
            username: normalizedUsername,
            imageUrl,
          },
        });

        // Initialize User Preferences if they do not exist
        await tx.userPreference.upsert({
          where: { userId: clerkId },
          update: {},
          create: {
            userId: clerkId,
            theme: "dark",
            currency: "USD",
            notificationsEnabled: true,
          },
        });
      });

      return NextResponse.json({ success: true, message: `User ${clerkId} synchronized` });
    } catch (dbError) {
      console.error("Database error while upserting user from Clerk webhook:", dbError);
      return new Response("Internal Database Error", {
        status: 500,
      });
    }
  }

  if (eventType === "user.deleted") {
    const { id: clerkId } = evt.data;

    if (!clerkId) {
      return new Response("Error: Missing user ID in event data", {
        status: 400,
      });
    }

    try {
      await prisma.user.delete({
        where: { id: clerkId },
      });
      return NextResponse.json({ success: true, message: `User ${clerkId} removed` });
    } catch (dbError) {
      console.error("Database error while deleting user from Clerk webhook:", dbError);
      return new Response("Internal Database Error", {
        status: 500,
      });
    }
  }

  return NextResponse.json({ success: true, message: `Webhook event ${eventType} skipped` });
}
