import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getClerkDeletedUserId,
  logPreservedClerkUserDeletion,
  normalizeClerkWebhookUserPayload,
  syncClerkUser,
} from "@/lib/users/clerk-user-sync";

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

  const body = await req.text();

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
    const normalizedUser = normalizeClerkWebhookUserPayload(evt.data);

    if (!normalizedUser) {
      return new Response("Error: Missing user ID in event data", {
        status: 400,
      });
    }

    try {
      await syncClerkUser(normalizedUser);

      return NextResponse.json({
        success: true,
        message: `User ${normalizedUser.id} synchronized`,
      });
    } catch (dbError) {
      console.error("Database error while upserting user from Clerk webhook:", dbError);
      return new Response("Internal Database Error", {
        status: 500,
      });
    }
  }

  if (eventType === "user.deleted") {
    const clerkId = getClerkDeletedUserId(evt.data);

    if (!clerkId) {
      return new Response("Error: Missing user ID in event data", {
        status: 400,
      });
    }

    logPreservedClerkUserDeletion(clerkId);

    return NextResponse.json({
      success: true,
      message: `User ${clerkId} preserved locally`,
    });
  }

  return NextResponse.json({ success: true, message: `Webhook event ${eventType} skipped` });
}
