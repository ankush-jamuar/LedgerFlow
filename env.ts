/**
 * env.ts — LedgerFlow Environment Validation
 *
 * Validates all required environment variables at application startup using Zod.
 * The application will throw a descriptive error and refuse to start if any
 * required variable is missing or malformed.
 *
 * Import this module in any server-side code that requires env access.
 * Never import this in client components — use NEXT_PUBLIC_ prefixed vars directly.
 */

import { z } from "zod";

const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .url("DATABASE_URL must be a valid URL"),

  // Clerk — server-side
  CLERK_SECRET_KEY: z
    .string()
    .min(1, "CLERK_SECRET_KEY is required")
    .startsWith("sk_", "CLERK_SECRET_KEY must start with 'sk_'"),
  CLERK_WEBHOOK_SECRET: z
    .string()
    .min(1, "CLERK_WEBHOOK_SECRET is required"),

  // Pusher — server-side
  PUSHER_APP_ID: z.string().min(1, "PUSHER_APP_ID is required"),
  PUSHER_KEY: z.string().min(1, "PUSHER_KEY is required"),
  PUSHER_SECRET: z.string().min(1, "PUSHER_SECRET is required"),
  PUSHER_CLUSTER: z.string().min(1, "PUSHER_CLUSTER is required"),
});

const clientEnvSchema = z.object({
  // Clerk — client-side
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required")
    .startsWith("pk_", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with 'pk_'"),
});

function validateEnv() {
  const serverResult = serverEnvSchema.safeParse(process.env);
  const clientResult = clientEnvSchema.safeParse(process.env);

  const errors: string[] = [];

  if (!serverResult.success) {
    errors.push(
      ...serverResult.error.issues.map(
        (e) => `[Server] ${e.path.join(".")}: ${e.message}`
      )
    );
  }

  if (!clientResult.success) {
    errors.push(
      ...clientResult.error.issues.map(
        (e) => `[Client] ${e.path.join(".")}: ${e.message}`
      )
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `\n\n❌ Invalid environment variables:\n\n${errors.map((e) => `  • ${e}`).join("\n")}\n\nCheck your .env.local file against .env.example.\n`
    );
  }

  return {
    ...serverResult.data!,
    ...clientResult.data!,
  };
}

export const env = validateEnv();
