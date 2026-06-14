/**
 * src/lib/hooks/use-preferences.ts — User Preferences Hooks
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export const PREFERENCES_QUERY_KEY = ["user", "preferences"] as const;

export function useUserPreferences() {
  return useQuery({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: () => api.preferences.get(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
