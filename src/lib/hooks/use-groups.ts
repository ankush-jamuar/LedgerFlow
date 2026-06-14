/**
 * src/lib/hooks/use-groups.ts — Groups TanStack Query Hooks
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export const GROUP_QUERY_KEYS = {
  list: ["groups"] as const,
  detail: (groupId: string) => ["groups", groupId] as const,
  members: (groupId: string) => ["groups", groupId, "members"] as const,
  expenses: (groupId: string) => ["groups", groupId, "expenses"] as const,
  settlements: (groupId: string) => ["groups", groupId, "settlements"] as const,
  balances: (groupId: string) => ["groups", groupId, "balances"] as const,
  timeline: (groupId: string) => ["groups", groupId, "timeline"] as const,
} as const;

export function useGroups() {
  return useQuery({
    queryKey: GROUP_QUERY_KEYS.list,
    queryFn: () => api.groups.list(),
    staleTime: 30 * 1000,
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: GROUP_QUERY_KEYS.detail(groupId),
    queryFn: () => api.groups.get(groupId),
    enabled: Boolean(groupId),
    staleTime: 30 * 1000,
  });
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: GROUP_QUERY_KEYS.members(groupId),
    queryFn: () => api.groups.members(groupId),
    enabled: Boolean(groupId),
    staleTime: 60 * 1000,
  });
}

export function useGroupExpenses(groupId: string) {
  return useQuery({
    queryKey: GROUP_QUERY_KEYS.expenses(groupId),
    queryFn: () => api.groups.expenses(groupId),
    enabled: Boolean(groupId),
    staleTime: 30 * 1000,
  });
}

export function useGroupSettlements(groupId: string) {
  return useQuery({
    queryKey: GROUP_QUERY_KEYS.settlements(groupId),
    queryFn: () => api.groups.settlements(groupId),
    enabled: Boolean(groupId),
    staleTime: 30 * 1000,
  });
}

export function useGroupBalances(groupId: string) {
  return useQuery({
    queryKey: GROUP_QUERY_KEYS.balances(groupId),
    queryFn: () => api.groups.balances(groupId),
    enabled: Boolean(groupId),
    staleTime: 15 * 1000, // Balances must stay very fresh
  });
}

export function useGroupTimeline(groupId: string) {
  return useQuery({
    queryKey: GROUP_QUERY_KEYS.timeline(groupId),
    queryFn: () => api.groups.timeline(groupId),
    enabled: Boolean(groupId),
    staleTime: 60 * 1000,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.groups.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.list });
    },
  });
}

export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      api.groups.update(groupId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.detail(groupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.list });
    },
  });
}

export function useArchiveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => api.groups.archive(groupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.list });
    },
  });
}

export function useAddGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; role?: string }) =>
      api.groups.addMember(groupId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.members(groupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.timeline(groupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.balances(groupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.detail(groupId) });
    },
  });
}

export function useChangeGroupMemberRole(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.groups.changeMemberRole(groupId, userId, { role }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.members(groupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.timeline(groupId) });
    },
  });
}

export function useRemoveGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.groups.removeMember(groupId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.members(groupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.timeline(groupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.balances(groupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.detail(groupId) });
    },
  });
}
