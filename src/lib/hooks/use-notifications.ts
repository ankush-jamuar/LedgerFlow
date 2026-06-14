/**
 * src/lib/hooks/use-notifications.ts — Notification Hook (Real DB Backend)
 *
 * Connected directly to the backend notifications API for listing and updating read status.
 */

"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface NotificationItem {
  id: string;
  type: "anomaly" | "expense" | "settlement" | "import" | "group";
  title: string;
  message: string;
  timestamp: string;
  severity?: "info" | "warning" | "critical";
  link?: string;
  isRead: boolean;
}

export const NOTIFICATION_QUERY_KEYS = {
  all: ["notifications"] as const,
};

export function useUserNotifications() {
  const queryClient = useQueryClient();

  // Load real DB notifications
  const { data, isLoading, refetch } = useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.all,
    queryFn: () => api.notifications.list(),
    staleTime: 10 * 1000, // cache for 10 seconds
  });

  const dbNotifications = useMemo(() => data?.notifications ?? [], [data?.notifications]);

  // Map db notifications to UI NotificationItem shapes
  const notifications = useMemo<NotificationItem[]>(() => {
    const typeMapping: Record<string, NotificationItem["type"]> = {
      GROUP_MEMBER_ADDED: "group",
      GROUP_MEMBER_REMOVED: "group",
      EXPENSE_CREATED: "expense",
      SETTLEMENT_CREATED: "settlement",
      IMPORT_COMPLETED: "import",
      ANOMALY_DETECTED: "anomaly",
    };

    return dbNotifications.map((n) => ({
      id: n.id,
      type: typeMapping[n.type] ?? "group",
      title: n.title,
      message: n.message,
      timestamp: n.createdAt,
      isRead: n.isRead,
      severity: n.type === "ANOMALY_DETECTED" ? "warning" : "info",
    }));
  }, [dbNotifications]);

  const readIds = useMemo(() => {
    return dbNotifications.filter((n) => n.isRead).map((n) => n.id);
  }, [dbNotifications]);

  const unreadCount = useMemo(() => {
    return dbNotifications.filter((n) => !n.isRead).length;
  }, [dbNotifications]);

  // Mutations
  const readMutation = useMutation({
    mutationFn: (id: string) => api.notifications.read(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.notifications.readAll(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });

  return {
    notifications,
    unreadCount,
    readIds,
    markAsRead: (id: string) => readMutation.mutate(id),
    markAllAsRead: () => readAllMutation.mutate(),
    isLoading,
    refetch,
  };
}
