import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

/**
 * src/app/(auth)/sign-in/[[...sign-in]]/page.tsx — Clerk Sign-In Page
 *
 * The catch-all route is required by Clerk's account portal embedded flow.
 * Appearance is configured in ClerkAuthProvider to match the LedgerFlow theme.
 */
export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold gradient-text mb-1">
          LedgerFlow
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Shared expense reconciliation
        </p>
      </div>
      <SignIn />
    </div>
  );
}
