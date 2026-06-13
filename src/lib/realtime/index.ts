/**
 * src/lib/realtime/index.ts — Pusher Client Initialisation
 *
 * Exports a configured Pusher server-side client (for triggering events from
 * server actions / API routes) and a browser client factory for the frontend.
 *
 * The Pusher server client is lazily instantiated to avoid import-time errors
 * when env vars are not yet validated.
 */

import Pusher from "pusher";
import PusherJs from "pusher-js";

let _pusherServer: Pusher | null = null;

/**
 * Returns the singleton server-side Pusher instance.
 * Call only from server actions or API route handlers.
 */
export function getPusherServer(): Pusher {
  if (!_pusherServer) {
    _pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return _pusherServer;
}

/**
 * Creates a browser-side Pusher client.
 * Call from a client component or hook — not during SSR.
 */
export function createPusherClient(): PusherJs {
  return new PusherJs(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });
}
