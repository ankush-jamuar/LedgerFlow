/**
 * src/lib/auth/index.ts — Clerk Auth Helpers
 *
 * Centralised re-exports and server-side auth utilities built on top of
 * @clerk/nextjs. Import from here rather than directly from @clerk/nextjs
 * so that the auth layer can be swapped without touching call sites.
 *
 * Server components: use `auth()` or `currentUser()`
 * Client components: use `useUser()` or `useAuth()` hooks from @clerk/nextjs
 */

import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Returns the current session's userId, throwing if the route is not
 * protected (i.e. the user is not authenticated).
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorised: no active session");
  }
  return userId;
}

/**
 * Returns the full Clerk user object for the current session,
 * or null if no session is active.
 */
export async function getSessionUser() {
  return currentUser();
}

export { auth, currentUser };
