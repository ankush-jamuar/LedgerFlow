import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
};

/**
 * src/app/(auth)/sign-up/[[...sign-up]]/page.tsx — Clerk Sign-Up Page
 *
 * The catch-all route is required by Clerk's account portal embedded flow.
 * Appearance is configured in ClerkAuthProvider to match the LedgerFlow theme.
 */
export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold gradient-text mb-1">
          LedgerFlow
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Create your account to get started
        </p>
      </div>
      <SignUp />
    </div>
  );
}
