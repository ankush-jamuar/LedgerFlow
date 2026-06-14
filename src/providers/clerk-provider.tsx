"use client";

/**
 * src/providers/clerk-provider.tsx — Clerk Authentication Provider
 *
 * Wraps the application in ClerkProvider and configures:
 *  - Redirect URLs (force + fallback to /dashboard)
 *  - Sign-in/sign-up page URLs
 *  - Theme appearance matching LedgerFlow brand
 *
 * Redirect config is set BOTH here and in .env for reliability.
 * Clerk v7 priority: component props > env vars > defaults.
 */

import { ClerkProvider } from "@clerk/nextjs";

interface ClerkAuthProviderProps {
  children: React.ReactNode;
}

export function ClerkAuthProvider({ children }: ClerkAuthProviderProps) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      appearance={{
        variables: {
          colorPrimary: "#7C3AED",
          colorBackground: "#050816",
          colorForeground: "#e2e8f0",
          colorMutedForeground: "#94a3b8",
          borderRadius: "0.5rem",
        },
        elements: {
          formButtonPrimary:
            "bg-violet-600 hover:bg-violet-700 text-white font-medium",
          card: "bg-[#0d1117] border border-white/10 shadow-2xl",
          headerTitle: "text-white",
          headerSubtitle: "text-slate-400",
          socialButtonsBlockButton:
            "border border-white/10 text-white hover:bg-white/5",
          dividerLine: "bg-white/10",
          dividerText: "text-slate-400",
          formFieldLabel: "text-slate-300",
          formFieldInput:
            "bg-[#161b22] border-white/10 text-white placeholder:text-slate-500",
          footerActionLink: "text-violet-400 hover:text-violet-300",
          identityPreviewText: "text-white",
          identityPreviewEditButton: "text-violet-400",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
