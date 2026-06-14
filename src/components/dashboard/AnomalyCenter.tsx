/**
 * src/components/dashboard/AnomalyCenter.tsx — Anomaly Center Panel
 *
 * Displays overview stats of open anomalies (by severity, type) and a list
 * of recent anomalies with badge indicators. Includes support for expanding
 * details to show row and column payload info.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  ShieldAlert,
  CheckCircle,
} from "lucide-react";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { DashboardAnomalyOverview } from "@/lib/dashboard/types";

interface AnomalyCenterProps {
  anomalyOverview?: DashboardAnomalyOverview;
  loading?: boolean;
}

export function AnomalyCenter({ anomalyOverview, loading = false }: AnomalyCenterProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading || !anomalyOverview) {
    return <SkeletonCard />;
  }

  const {
    totalAnomalies,
    bySeverity,
    openCount,
    recentAnomalies,
  } = anomalyOverview;

  // Severity helper mapping
  const severityConfig = {
    CRITICAL: {
      label: "Critical",
      colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      icon: ShieldAlert,
    },
    WARNING: {
      label: "Warning",
      colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      icon: AlertTriangle,
    },
    INFO: {
      label: "Info",
      colorClass: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      icon: Info,
    },
  };

  // Anomaly type mapping for user-friendly text
  const formatAnomalyType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="glass rounded-xl p-5 flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-4.5 w-4.5 text-[var(--color-danger-light)]" />
          <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
            Anomaly Center
          </h3>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-danger-ghost)] text-[var(--color-danger-light)] border border-[var(--color-danger)]/10">
          {openCount} Open
        </span>
      </div>

      {totalAnomalies === 0 ? (
        <div className="flex-1 flex items-center justify-center py-6">
          <EmptyState
            icon={CheckCircle}
            title="All clear"
            description="No transaction anomalies detected in your ledgers."
          />
        </div>
      ) : (
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 flex-shrink-0">
            {Object.entries(severityConfig).map(([key, config]) => {
              const count = bySeverity[key as keyof typeof bySeverity] ?? 0;
              const Icon = config.icon;
              return (
                <div
                  key={key}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border ${config.colorClass}`}
                >
                  <Icon className="h-4 w-4 mb-1" />
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {config.label}
                  </span>
                  <span className="text-lg font-bold leading-tight mt-0.5">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Recent Anomalies List */}
          <div className="flex-1 overflow-y-auto pr-1 max-h-[260px] custom-scrollbar space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
              Recent Alerts
            </h4>

            {recentAnomalies.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] text-center py-4">
                No recent anomaly logs.
              </p>
            ) : (
              recentAnomalies.map((anomaly) => {
                const config =
                  severityConfig[anomaly.severity as keyof typeof severityConfig] ??
                  severityConfig.INFO;
                const isExpanded = expandedId === anomaly.id;
                const payload = anomaly.payload as {
                  message?: string;
                  rowNumber?: number;
                  column?: string;
                  value?: unknown;
                  rawRow?: unknown;
                } | null;

                return (
                  <div
                    key={anomaly.id}
                    className="border border-[var(--glass-border)] rounded-lg overflow-hidden transition-colors hover:border-[var(--glass-border-hover)] bg-white/[0.01]"
                  >
                    {/* Header bar click triggers expand */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : anomaly.id)
                      }
                      className="w-full flex items-center justify-between p-3 text-left transition-colors hover:bg-white/[0.02] gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${config.colorClass}`}
                          >
                            {anomaly.severity}
                          </span>
                          <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                            {formatAnomalyType(anomaly.type)}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                          Session {anomaly.importSessionId.slice(0, 8)} • Row{" "}
                          {payload?.rowNumber ?? "N/A"}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-[var(--color-text-muted)]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
                      )}
                    </button>

                    {/* Expandable detailed payload drawer */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden border-t border-[var(--glass-border)] bg-black/10 text-[11px]"
                        >
                          <div className="p-3 space-y-2 text-[var(--color-text-secondary)] font-mono leading-relaxed">
                            {payload?.message && (
                              <p className="text-[var(--color-text-primary)] font-sans border-b border-[var(--glass-border)] pb-2 mb-2 font-medium">
                                {payload.message}
                              </p>
                            )}
                            
                            {payload?.rowNumber !== undefined && (
                              <div>
                                <span className="text-[var(--color-text-muted)]">Row Index: </span>
                                <span className="text-[var(--color-primary-light)]">{payload.rowNumber}</span>
                              </div>
                            )}

                            {payload?.column !== undefined && (
                              <div>
                                <span className="text-[var(--color-text-muted)]">Col Field: </span>
                                <span className="text-[var(--color-secondary-light)]">{payload.column}</span>
                              </div>
                            )}

                            {payload?.value !== undefined && (
                              <div className="bg-black/20 p-2 rounded border border-[var(--glass-border)] break-all mt-1">
                                <span className="text-[var(--color-text-muted)] block text-[9px] mb-1 uppercase font-bold tracking-wider">Raw Input Value</span>
                                <span className="text-white">{String(payload.value)}</span>
                              </div>
                            )}

                            {!!payload?.rawRow && (
                              <div className="bg-black/20 p-2 rounded border border-[var(--glass-border)] overflow-x-auto custom-scrollbar mt-1">
                                <span className="text-[var(--color-text-muted)] block text-[9px] mb-1 uppercase font-bold tracking-wider">Raw CSV Context</span>
                                <pre className="text-[10px] text-[var(--color-text-secondary)]">
                                  {JSON.stringify(payload.rawRow, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
