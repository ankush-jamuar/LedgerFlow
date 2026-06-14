/**
 * src/lib/hooks/use-settlements.ts — Settlements TanStack Query Hooks
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export const SETTLEMENT_QUERY_KEYS = {
  detail: (settlementId: string) => ["settlements", settlementId] as const,
} as const;

export function useSettlement(settlementId: string) {
  return useQuery({
    queryKey: SETTLEMENT_QUERY_KEYS.detail(settlementId),
    queryFn: () => api.settlements.get(settlementId),
    enabled: Boolean(settlementId),
    staleTime: 30 * 1000,
  });
}
