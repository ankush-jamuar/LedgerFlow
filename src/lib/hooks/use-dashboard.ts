/**
 * src/lib/hooks/use-dashboard.ts — Dashboard TanStack Query Hooks
 *
 * All dashboard data hooks. Each hook maps to one API endpoint.
 * Stale time and refetch intervals are tuned for financial data
 * (conservative — we don't want stale balances displayed).
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export const DASHBOARD_QUERY_KEYS = {
  overview: ["dashboard", "overview"] as const,
  activity: (limit?: number) => ["dashboard", "activity", limit] as const,
  anomalies: ["dashboard", "anomalies"] as const,
  reports: ["dashboard", "reports"] as const,
} as const;

/** Core KPI metrics — groups, expenses, settlements, balance totals */
export function useDashboardOverview() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.overview,
    queryFn: () => api.dashboard.overview(),
    staleTime: 30 * 1000, // 30 seconds — financial data should stay fresh
  });
}

/** Recent activity feed items */
export function useDashboardActivity(limit = 20) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.activity(limit),
    queryFn: () => api.dashboard.activity(),
    staleTime: 60 * 1000,
  });
}

/** Anomaly overview and recent anomaly list */
export function useDashboardAnomalies() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.anomalies,
    queryFn: () => api.dashboard.anomalies(),
    staleTime: 60 * 1000,
  });
}

/** Financial reports: monthly spending, top payers, currency breakdown */
export function useDashboardReports() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.reports,
    queryFn: () => api.dashboard.reports(),
    staleTime: 5 * 60 * 1000, // Reports can be cached longer
  });
}
