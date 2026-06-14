/**
 * src/lib/hooks/use-imports.ts — Imports TanStack Query Hooks
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export const IMPORT_QUERY_KEYS = {
  detail: (importSessionId: string) => ["imports", importSessionId] as const,
  groupList: (groupId: string) => ["groups", groupId, "imports"] as const,
} as const;

export function useImportSession(importSessionId: string) {
  return useQuery({
    queryKey: IMPORT_QUERY_KEYS.detail(importSessionId),
    queryFn: () => api.imports.get(importSessionId),
    enabled: Boolean(importSessionId),
    staleTime: 30 * 1000,
  });
}

export function useGroupImports(groupId: string) {
  return useQuery({
    queryKey: IMPORT_QUERY_KEYS.groupList(groupId),
    queryFn: () => api.groups.imports(groupId),
    enabled: Boolean(groupId),
    staleTime: 30 * 1000,
  });
}

export function useUploadImport(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.imports.upload(groupId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: IMPORT_QUERY_KEYS.groupList(groupId) });
      void queryClient.invalidateQueries({ queryKey: ["groups", groupId, "expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["groups", groupId, "balances"] });
      void queryClient.invalidateQueries({ queryKey: ["groups", groupId, "timeline"] });
    },
  });
}
