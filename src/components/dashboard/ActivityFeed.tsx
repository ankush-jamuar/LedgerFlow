/**
 * src/components/dashboard/ActivityFeed.tsx — Recent Activity Feed Panel
 *
 * Renders a scrollable timeline of recent activity logs across accessible groups.
 * Provides micro-animations on hover and lists details with currency indicators.
 */

"use client";

import { motion } from "framer-motion";
import {
  Activity,
  PlusCircle,
  UserPlus,
  Receipt,
  Handshake,
  UploadCloud,
  FileCheck,
  AlertTriangle,
} from "lucide-react";
import { formatMoney } from "@/lib/utils/format-money";
import { formatRelativeTime } from "@/lib/utils/format-date";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ActivityItem } from "@/lib/api/client";

interface ActivityFeedProps {
  activities?: ActivityItem[];
  loading?: boolean;
}

// Map activity actions to icons & color schemes
function getActivityMeta(action: string) {
  switch (action) {
    case "GROUP_CREATED":
      return {
        icon: PlusCircle,
        colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        message: "created the group",
      };
    case "GROUP_UPDATED":
      return {
        icon: PlusCircle,
        colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        message: "updated the group details",
      };
    case "GROUP_ARCHIVED":
      return {
        icon: AlertTriangle,
        colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        message: "archived the group",
      };
    case "MEMBER_ADDED":
      return {
        icon: UserPlus,
        colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        message: "added member",
      };
    case "MEMBER_REMOVED":
      return {
        icon: UserPlus,
        colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        message: "removed member",
      };
    case "ROLE_CHANGED":
      return {
        icon: UserPlus,
        colorClass: "bg-violet-500/10 text-violet-400 border-violet-500/20",
        message: "changed role",
      };
    case "EXPENSE_CREATED":
      return {
        icon: Receipt,
        colorClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        message: "added expense",
      };
    case "EXPENSE_UPDATED":
      return {
        icon: Receipt,
        colorClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        message: "edited expense",
      };
    case "EXPENSE_DELETED":
      return {
        icon: Receipt,
        colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        message: "deleted expense",
      };
    case "SETTLEMENT_CREATED":
      return {
        icon: Handshake,
        colorClass: "bg-teal-500/10 text-teal-400 border-teal-500/20",
        message: "recorded a payment",
      };
    case "SETTLEMENT_UPDATED":
      return {
        icon: Handshake,
        colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        message: "updated payment details",
      };
    case "IMPORT_STARTED":
      return {
        icon: UploadCloud,
        colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        message: "started CSV import",
      };
    case "IMPORT_COMPLETED":
      return {
        icon: FileCheck,
        colorClass: "bg-green-500/10 text-green-400 border-green-500/20",
        message: "completed CSV import",
      };
    case "IMPORT_FAILED":
      return {
        icon: AlertTriangle,
        colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        message: "CSV import failed",
      };
    case "ANOMALY_CREATED":
      return {
        icon: AlertTriangle,
        colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        message: "detected an anomaly",
      };
    case "REPORT_GENERATED":
      return {
        icon: FileCheck,
        colorClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        message: "generated import report",
      };
    case "GROUP_RESTORED":
      return {
        icon: PlusCircle,
        colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        message: "restored the group from archives",
      };
    default:
      return {
        icon: Activity,
        colorClass: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        message: "performed an action",
      };

  }
}

export function ActivityFeed({ activities = [], loading = false }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="glass rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-[var(--color-primary-light)]" />
            <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Recent Activity</h3>
          </div>
        </div>
        <div className="divide-y divide-[var(--glass-border)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 border-b border-[var(--glass-border)] pb-3 mb-4">
          <Activity className="h-4.5 w-4.5 text-[var(--color-primary-light)]" />
          <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Recent Activity</h3>
        </div>
        <EmptyState
          icon={Activity}
          title="No recent activity"
          description="Activities across your groups will show up here as they occur."
        />
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 border-b border-[var(--glass-border)] pb-3 mb-4 flex-shrink-0">
        <Activity className="h-4.5 w-4.5 text-[var(--color-primary-light)]" />
        <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Recent Activity</h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 max-h-[560px] custom-scrollbar space-y-3.5 relative">
        {/* Continuous vertical line */}
        <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[var(--glass-border)] via-[var(--glass-border)]/50 to-transparent pointer-events-none" />

        {activities.map((item, idx) => {
          const meta = getActivityMeta(item.action);
          const Icon = meta.icon;
          
          // Type assertion for nested query data
          const itemWithRelations = item as ActivityItem & {
            actor?: {
              id: string;
              username: string | null;
              email: string | null;
              firstName: string | null;
              lastName: string | null;
            } | null;
            group?: {
              id: string;
              name: string;
              currency: string;
            } | null;
          };
          const actor = itemWithRelations.actor;
          const group = itemWithRelations.group;
          const payload = item.payload as { description?: string; baseAmount?: number; name?: string } | null;

          const actorName = actor 
            ? actor.firstName 
              ? `${actor.firstName} ${actor.lastName ?? ""}`.trim()
              : actor.username ?? actor.email ?? "Someone"
            : "Someone";
            
          const groupName = group ? group.name : "a group";
          const groupCurrency = group ? group.currency : "USD";

          // Format description message detail
          let detailsText = "";
          if (item.action === "EXPENSE_CREATED" && payload?.description) {
            detailsText = `"${payload.description}" for ${formatMoney(payload.baseAmount, groupCurrency)}`;
          } else if (item.action === "SETTLEMENT_CREATED" && payload?.baseAmount) {
            detailsText = `amounting to ${formatMoney(payload.baseAmount, groupCurrency)}`;
          } else if (payload?.name) {
            detailsText = `"${payload.name}"`;
          }

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
              className="flex items-start gap-3.5 relative pl-1 group"
            >
              {/* Event Badge/Icon */}
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${meta.colorClass} z-10 transition-transform group-hover:scale-105`}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Text Content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  <span className="font-semibold text-[var(--color-text-primary)]">{actorName}</span>{" "}
                  {meta.message}{" "}
                  {detailsText && (
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {detailsText}
                    </span>
                  )}{" "}
                  in <span className="font-medium text-[var(--color-text-secondary)]">{groupName}</span>
                </p>
                <span className="text-[10px] text-[var(--color-text-muted)] mt-1 block">
                  {formatRelativeTime(item.createdAt)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
