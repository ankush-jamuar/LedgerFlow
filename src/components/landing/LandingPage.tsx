"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileWarning,
  Globe2,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    title: "Membership Timeline Tracking",
    description:
      "Members can join and leave groups without breaking historical expense accuracy.",
    icon: Clock3,
  },
  {
    title: "Multi-Currency Support",
    description:
      "Track expenses in different currencies with conversion-aware reconciliation.",
    icon: Globe2,
  },
  {
    title: "Import & Anomaly Detection",
    description:
      "Detect duplicates, settlement mistakes, invalid dates, and membership conflicts during CSV imports.",
    icon: FileWarning,
  },
  {
    title: "Explainable Balances",
    description:
      "Every balance can be traced back to the exact expenses that created it.",
    icon: ShieldCheck,
  },
] as const;

const problemSolvers = [
  {
    problem: "Meera moved out",
    solution:
      "Membership timelines preserve her past shares while excluding her from later expenses.",
  },
  {
    problem: "Sam joined later",
    solution:
      "Join dates keep earlier expenses away from members who were not active yet.",
  },
  {
    problem: "Expenses span multiple currencies",
    solution:
      "Original amounts, exchange rates, and base amounts stay available for reconciliation.",
  },
  {
    problem: "Settlements were logged incorrectly",
    solution:
      "Settlements are tracked separately from expenses to prevent balance double-counting.",
  },
  {
    problem: "CSV data contains anomalies",
    solution:
      "Import checks surface duplicates, invalid dates, unknown members, and timeline conflicts.",
  },
] as const;

const footerLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Groups", href: "/groups" },
  { label: "Expenses", href: "/expenses" },
  { label: "Settings", href: "/settings" },
] as const;

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[var(--color-brand-bg)] text-[var(--color-text-primary)]">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(5,8,22,0.18),#050816_78%)]" />

      <header className="sticky top-0 z-50 border-b border-[var(--glass-border)] bg-[rgba(5,8,22,0.74)] backdrop-blur-xl">
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-[var(--color-primary-ghost)]">
              <ReceiptText className="size-4 text-[var(--color-primary-light)]" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              LedgerFlow
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-white/5 hover:text-[var(--color-text-primary)] sm:px-4"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white shadow-[0_0_32px_rgba(124,58,237,0.28)] transition hover:bg-[var(--color-primary-light)]"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
            <motion.div
              initial="initial"
              animate="animate"
              transition={{ staggerChildren: 0.08 }}
              className="max-w-3xl"
            >
              <motion.p
                variants={fadeUp}
                className="mb-5 inline-flex rounded-full border border-[var(--glass-border)] bg-white/[0.04] px-3 py-1 text-sm font-medium text-[var(--color-secondary-light)]"
              >
                Shared Expense Reconciliation Platform
              </motion.p>
              <motion.h1
                variants={fadeUp}
                className="text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl"
              >
                Shared Expenses Without Spreadsheet Chaos
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-2xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg"
              >
                Track expenses, manage changing group memberships, reconcile
                balances, import messy CSV data, and settle debts with complete
                transparency.
              </motion.p>
              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  href="/sign-up"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-[0_0_40px_rgba(124,58,237,0.32)] transition hover:bg-[var(--color-primary-light)]"
                >
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-white/[0.04] px-5 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-white/[0.08]"
                >
                  Sign In
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.55 }}
              className="glass relative overflow-hidden rounded-xl p-5 shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-secondary)] to-transparent" />
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Reconciliation Snapshot
                  </p>
                  <h2 className="text-lg font-semibold text-white">
                    Import Review
                  </h2>
                </div>
                <span className="rounded-full bg-[var(--color-success-ghost)] px-3 py-1 text-xs font-semibold text-[var(--color-success)]">
                  Explainable
                </span>
              </div>

              <div className="space-y-3">
                {problemSolvers.slice(0, 4).map((item) => (
                  <div
                    key={item.problem}
                    className="rounded-lg border border-[var(--glass-border)] bg-black/20 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                      <CheckCircle2 className="size-4 text-[var(--color-secondary)]" />
                      {item.problem}
                    </div>
                    <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                      {item.solution}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-[var(--glass-border)] bg-white/[0.02] py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-semibold text-[var(--color-secondary-light)]">
                Core Capabilities
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                Built for balances that need to be defended
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <motion.article
                    key={feature.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ delay: index * 0.05 }}
                    className="glass rounded-xl p-5"
                  >
                    <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-[var(--color-primary-ghost)] text-[var(--color-primary-light)]">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-base font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                      {feature.description}
                    </p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold text-[var(--color-secondary-light)]">
                Real-World Ready
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                Built For Real-World Shared Expenses
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)]">
                LedgerFlow is designed around the messy cases that make shared
                expense spreadsheets fragile: changing roommates, mixed
                currencies, misclassified payments, and imported data that needs
                review before it becomes financial history.
              </p>
            </div>

            <div className="grid gap-3">
              {problemSolvers.map((item) => (
                <div
                  key={item.problem}
                  className="glass grid gap-3 rounded-xl p-4 sm:grid-cols-[220px_1fr]"
                >
                  <div className="font-semibold text-white">{item.problem}</div>
                  <div className="text-sm leading-6 text-[var(--color-text-secondary)]">
                    {item.solution}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--glass-border)] bg-black/20">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-white">LedgerFlow</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Shared Expense Reconciliation Platform
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[var(--color-text-secondary)] transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
