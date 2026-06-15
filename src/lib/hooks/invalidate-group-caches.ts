"use client";

import type { QueryClient } from "@tanstack/react-query";
import { GROUP_QUERY_KEYS } from "@/lib/hooks/use-groups";

/** Invalidate all group-scoped financial queries after a mutation. */
export async function invalidateGroupFinancialCaches(
  queryClient: QueryClient,
  groupId: string
) {
  // Critical financial data — refetch immediately (active queries only)
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: GROUP_QUERY_KEYS.expenses(groupId),
      refetchType: "active",
    }),
    queryClient.invalidateQueries({
      queryKey: GROUP_QUERY_KEYS.balances(groupId),
      refetchType: "active",
    }),
  ]);

  // Secondary data — mark stale but don't force-refetch background
  void queryClient.invalidateQueries({
    queryKey: GROUP_QUERY_KEYS.settlements(groupId),
    refetchType: "active",
  });
  void queryClient.invalidateQueries({
    queryKey: GROUP_QUERY_KEYS.detail(groupId),
    refetchType: "active",
  });
  void queryClient.invalidateQueries({
    queryKey: GROUP_QUERY_KEYS.list,
    refetchType: "active",
  });
  void queryClient.invalidateQueries({
    queryKey: ["dashboard"],
    refetchType: "active",
  });
  // Timeline rarely changes on financial mutations — just mark stale
  void queryClient.invalidateQueries({
    queryKey: GROUP_QUERY_KEYS.timeline(groupId),
    refetchType: "none",
  });
}
