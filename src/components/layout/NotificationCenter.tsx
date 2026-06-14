/**
 * src/components/layout/NotificationCenter.tsx — Premium Notification Center Dropdown
 *
 * Exposes a button with unread counts and a glassmorphic dropdown panel.
 * Group notifications by timeframe: Today, Yesterday, and Earlier.
 * Employs clicks-outside listeners and Framer Motion transitions.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Receipt,
  Handshake,
  FileSpreadsheet,
  AlertTriangle,
  Users,
  CheckCircle2,
} from "lucide-react";
import { useUserNotifications, type NotificationItem } from "@/lib/hooks/use-notifications";
import { formatRelativeTime } from "@/lib/utils/format-date";
import { cn } from "@/lib/utils/cn";

// Grouping helper
function groupNotifications(items: NotificationItem[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, NotificationItem[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  items.forEach((item) => {
    const d = new Date(item.timestamp);
    d.setHours(0, 0, 0, 0);

    if (d.getTime() === today.getTime()) {
      groups.Today!.push(item);
    } else if (d.getTime() === yesterday.getTime()) {
      groups.Yesterday!.push(item);
    } else {
      groups.Earlier!.push(item);
    }
  });

  return groups;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    readIds,
    markAsRead,
    markAllAsRead,
    isLoading,
  } = useUserNotifications();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = () => setIsOpen((v) => !v);

  // Group notifications by timeframe
  const grouped = groupNotifications(notifications);

  const getIcon = (type: NotificationItem["type"]) => {
    if (type === "anomaly") return AlertTriangle;
    if (type === "expense") return Receipt;
    if (type === "settlement") return Handshake;
    if (type === "import") return FileSpreadsheet;
    return Users;
  };

  const getIconColor = (type: NotificationItem["type"], severity?: string) => {
    if (type === "anomaly") {
      return severity === "critical" ? "text-rose-400" : "text-amber-400";
    }
    if (type === "expense") return "text-indigo-400";
    if (type === "settlement") return "text-teal-400";
    if (type === "import") return "text-emerald-400";
    return "text-blue-400";
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        id="topbar-notifications"
        onClick={toggleOpen}
        aria-label="Open notifications center"
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-brand-hover)] hover:text-[var(--color-text-secondary)] transition-colors",
          isOpen && "bg-[var(--color-brand-hover)] text-[var(--color-text-primary)]"
        )}
      >
        <Bell className="h-4 w-4" />
        
        {/* Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[9px] font-bold text-white ring-2 ring-[var(--color-brand-bg)] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[var(--glass-border)] bg-[var(--color-brand-surface)]/95 backdrop-blur-xl shadow-2xl z-[900] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4 flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Notifications</h3>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  {unreadCount} unread items
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-primary-light)] hover:text-[var(--color-text-primary)] transition-colors uppercase tracking-wider"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List area */}
            <div className="max-h-[360px] overflow-y-auto custom-scrollbar p-2 space-y-3">
              {isLoading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="size-6 border-2 border-t-transparent border-[var(--color-primary)] rounded-full animate-spin" />
                  <span className="text-xs text-[var(--color-text-muted)]">Checking alerts...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-10 w-10 text-[var(--color-success)]/40 mb-3" />
                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">All caught up!</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    No notifications or warnings currently logged.
                  </p>
                </div>
              ) : 
                Object.entries(grouped).map(([timeframe, items]) => {
                  if (!items || items.length === 0) return null;

                  return (
                    <div key={timeframe} className="space-y-1.5">
                      <h4 className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] px-2">
                        {timeframe}
                      </h4>

                      <div className="space-y-1">
                        {items.map((item) => {
                          const Icon = getIcon(item.type);
                          const isRead = readIds.includes(item.id);

                          return (
                            <div
                              key={item.id}
                              onClick={() => markAsRead(item.id)}
                              className={cn(
                                "flex items-start gap-3 p-2.5 rounded-lg border border-transparent transition-all cursor-pointer relative group",
                                isRead
                                  ? "hover:bg-[var(--color-brand-hover)]/40 text-[var(--color-text-secondary)]"
                                  : "bg-[var(--color-brand-hover)]/30 hover:bg-[var(--color-brand-hover)] border-[var(--color-brand-border)] text-[var(--color-text-primary)]"
                              )}
                            >
                              {/* Left Icon */}
                              <div
                                className={cn(
                                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-surface-2)] border border-[var(--color-brand-border)]",
                                  getIconColor(item.type, item.severity)
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>

                              {/* Content */}
                              <div className="min-w-0 flex-1 pt-0.5">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-bold truncate">
                                    {item.title}
                                  </p>
                                  {!isRead && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-light)] flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                                  {item.message}
                                </p>
                                <span className="text-[8px] text-[var(--color-text-muted)] mt-1 block">
                                  {formatRelativeTime(item.timestamp)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
