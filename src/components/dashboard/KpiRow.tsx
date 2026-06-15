/**
 * src/components/dashboard/KpiRow.tsx — Dashboard KPI Row Component
 *
 * Employs responsive grid displaying 6 cards of top-level metrics.
 * Integrates directly with Framer Motion for stagger entrance animations.
 */

"use client";

import { motion } from "framer-motion";
import {
  Coins,
  Scale,
  Users,
  Receipt,
  Handshake,
  FileSpreadsheet,
} from "lucide-react";
import { KpiCard } from "@/components/ui/KpiCard";
import { formatMoneyCompact } from "@/lib/utils/format-money";
import type { DashboardOverview } from "@/lib/dashboard/types";

interface KpiRowProps {
  overview?: DashboardOverview;
  loading?: boolean;
  currencyPreference?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export function KpiRow({
  overview,
  loading = false,
  currencyPreference = "INR",
}: KpiRowProps) {
  // If loading or overview is not available yet, render 6 loading skeleton cards
  if (loading || !overview) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiCard key={i} label="" value="" loading />
        ))}
      </div>
    );
  }

  const baseCurrency = overview.currenciesUsed[0] ?? currencyPreference;

  const cards = [
    {
      label: "Total Tracked",
      value: formatMoneyCompact(overview.totalAmountTracked, baseCurrency),
      icon: Coins,
      subValue: `Across all periods`,
    },
    {
      label: "Net Outstanding",
      value: formatMoneyCompact(overview.outstandingBalance, baseCurrency),
      icon: Scale,
      trend: overview.outstandingBalance > 0 ? ("up" as const) : overview.outstandingBalance < 0 ? ("down" as const) : ("neutral" as const),
      positiveIsGood: true,
      subValue:
        overview.outstandingBalance > 0
          ? "Creditor — you are owed"
          : overview.outstandingBalance < 0
          ? "Debtor — you owe others"
          : "All settled up",
    },
    {
      label: "Active Groups",
      value: `${overview.activeGroups}`,
      icon: Users,
      subValue: `${overview.totalGroups} total groups`,
    },
    {
      label: "Active Expenses",
      value: `${overview.activeExpenses}`,
      icon: Receipt,
      subValue: `${overview.totalExpenses} total bills`,
    },
    {
      label: "Settlements",
      value: `${overview.totalSettlements}`,
      icon: Handshake,
      subValue: "Debt resolutions",
    },
    {
      label: "Imports",
      value: `${overview.totalImportSessions}`,
      icon: FileSpreadsheet,
      subValue: "CSV ledgers processed",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6"
    >
      {cards.map((card, index) => (
        <KpiCard
          key={index}
          label={card.label}
          value={card.value}
          icon={card.icon}
          trend={card.trend}
          positiveIsGood={card.positiveIsGood}
          subValue={card.subValue}
        />
      ))}
    </motion.div>
  );
}
