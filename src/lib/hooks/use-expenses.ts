/**
 * src/lib/hooks/use-expenses.ts — Expenses TanStack Query Hooks
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { GROUP_QUERY_KEYS } from "./use-groups";

export const EXPENSE_QUERY_KEYS = {
  detail: (expenseId: string) => ["expenses", expenseId] as const,
} as const;

export function useExpense(expenseId: string) {
  return useQuery({
    queryKey: EXPENSE_QUERY_KEYS.detail(expenseId),
    queryFn: () => api.expenses.get(expenseId),
    enabled: Boolean(expenseId),
    staleTime: 30 * 1000,
  });
}

export function useUpdateExpense(expenseId: string, groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.expenses.update(expenseId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EXPENSE_QUERY_KEYS.detail(expenseId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.expenses(groupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.balances(groupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.timeline(groupId) });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteExpense(expenseId: string, groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.expenses.delete(expenseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.expenses(groupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.balances(groupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.timeline(groupId) });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
