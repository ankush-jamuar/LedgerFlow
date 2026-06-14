import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkAuthProvider } from "@/providers/clerk-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LedgerFlow — Shared Expense Reconciliation",
    template: "%s | LedgerFlow",
  },
  description:
    "LedgerFlow is a production-grade shared expense reconciliation platform. Track group expenses, settle balances, and import transactions from CSV — with real-time updates and anomaly detection.",
  keywords: [
    "expense tracking",
    "group expenses",
    "expense reconciliation",
    "bill splitting",
    "settlement",
  ],
  authors: [{ name: "LedgerFlow Team" }],
  creator: "LedgerFlow",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "LedgerFlow — Shared Expense Reconciliation",
    description: "Track, split, and settle shared expenses with your groups.",
    siteName: "LedgerFlow",
  },
  twitter: {
    card: "summary_large_image",
    title: "LedgerFlow",
    description: "Track, split, and settle shared expenses with your groups.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#050816",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <ClerkAuthProvider>
            <QueryProvider>
              <ToastProvider>{children}</ToastProvider>
            </QueryProvider>
          </ClerkAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
