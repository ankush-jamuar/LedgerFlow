/**
 * src/components/dashboard/ImportInsights.tsx — Import Analytics Panel
 *
 * Visualizes CSV import activities, processing success ratios (imported vs rejected),
 * and status distribution using simple layout bars and indicators.
 */

"use client";

import { motion } from "framer-motion";
import { FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { DashboardReports } from "@/lib/dashboard/types";

interface ImportInsightsProps {
  reports?: DashboardReports;
  loading?: boolean;
}

export function ImportInsights({ reports, loading = false }: ImportInsightsProps) {
  if (loading || !reports) {
    return <SkeletonCard />;
  }

  const { importStatistics } = reports;

  if (!importStatistics || importStatistics.totalImports === 0) {
    return (
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 border-b border-[var(--glass-border)] pb-3 mb-4">
          <FileSpreadsheet className="h-4.5 w-4.5 text-[var(--color-secondary-light)]" />
          <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Import Insights</h3>
        </div>
        <EmptyState
          icon={FileSpreadsheet}
          title="No imports found"
          description="Upload CSV ledgers to see ingestion analytics and quality insights."
        />
      </div>
    );
  }

  const {
    totalImports,
    byStatus,
    importedRows,
    rejectedRows,
    anomalyCount,
  } = importStatistics;

  const totalRows = importedRows + rejectedRows;
  const successRate = totalRows > 0 ? (importedRows / totalRows) * 100 : 0;
  const rejectRate = totalRows > 0 ? (rejectedRows / totalRows) * 100 : 0;

  // Status breakdown helpers
  const statuses = [
    { key: "COMPLETED", label: "Success", colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle },
    { key: "PARTIAL", label: "Partial", colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: AlertTriangle },
    { key: "FAILED", label: "Failed", colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/20", icon: XCircle },
  ];

  return (
    <div className="glass rounded-xl p-5 flex flex-col h-full">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-[var(--glass-border)] pb-3 mb-4 flex-shrink-0">
        <FileSpreadsheet className="h-4.5 w-4.5 text-[var(--color-secondary-light)]" />
        <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Import Insights</h3>
      </div>

      <div className="space-y-4.5 flex-1 flex flex-col justify-between">
        {/* Top summary row */}
        <div className="grid grid-cols-2 gap-3 flex-shrink-0">
          <div className="p-3 bg-white/[0.01] border border-[var(--glass-border)] rounded-lg">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] block mb-1">
              Ledgers Ingested
            </span>
            <span className="text-xl font-extrabold text-[var(--color-text-primary)]">
              {totalImports}
            </span>
          </div>
          <div className="p-3 bg-white/[0.01] border border-[var(--glass-border)] rounded-lg">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] block mb-1">
              Issues Flagged
            </span>
            <span className="text-xl font-extrabold text-[var(--color-danger-light)]">
              {anomalyCount}
            </span>
          </div>
        </div>

        {/* Row reconciliation bar chart */}
        <div className="space-y-2 flex-shrink-0">
          <div className="flex justify-between text-[11px] font-medium">
            <span className="text-[var(--color-text-secondary)]">Reconciliation Quality</span>
            <span className="text-[var(--color-success)]">{successRate.toFixed(1)}% Ingested</span>
          </div>
          
          {/* Progress stack */}
          <div className="h-3 w-full rounded-full bg-black/30 overflow-hidden flex border border-[var(--glass-border)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${successRate}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
              title={`Imported: ${importedRows} rows`}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${rejectRate}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-rose-500 to-red-400"
              title={`Rejected: ${rejectedRows} rows`}
            />
          </div>

          {/* Legend */}
          <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] pt-0.5">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Imported ({importedRows})</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span>Rejected ({rejectedRows})</span>
            </div>
          </div>
        </div>

        {/* Statuses distribution */}
        <div className="space-y-2 flex-shrink-0">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            Status Breakdown
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {statuses.map((s) => {
              const count = byStatus[s.key as keyof typeof byStatus] ?? 0;
              const Icon = s.icon;
              return (
                <div
                  key={s.key}
                  className={`flex flex-col items-center p-2 rounded-lg border ${s.colorClass}`}
                >
                  <Icon className="h-3.5 w-3.5 mb-1" />
                  <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)]">
                    {s.label}
                  </span>
                  <span className="text-sm font-bold mt-0.5">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
