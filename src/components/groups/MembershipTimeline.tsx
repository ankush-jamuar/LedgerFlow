/**
 * src/components/groups/MembershipTimeline.tsx — Membership Timeline
 *
 * Visual vertical timeline showing group membership events:
 * joined, left, role changes. Uses staggered Framer Motion animations.
 */

"use client";

import { motion } from "framer-motion";
import { UserPlus, UserMinus, Clock } from "lucide-react";
import { useGroupTimeline } from "@/lib/hooks/use-groups";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

interface MembershipTimelineProps {
  groupId: string;
}

interface TimelineEvent {
  id: string;
  type: "joined" | "left";
  userId: string;
  role: string;
  date: string;
}

export function MembershipTimeline({ groupId }: MembershipTimelineProps) {
  const { data, isLoading } = useGroupTimeline(groupId);

  if (isLoading) {
    return (
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-6 w-6" rounded />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  const memberships = data?.memberships ?? [];

  // Build timeline events from memberships
  const events: TimelineEvent[] = [];
  memberships.forEach((m) => {
    events.push({
      id: `${m.id}-join`,
      type: "joined",
      userId: m.userId,
      role: m.role,
      date: m.joinedAt,
    });
    if (m.leftAt) {
      events.push({
        id: `${m.id}-left`,
        type: "left",
        userId: m.userId,
        role: m.role,
        date: m.leftAt,
      });
    }
  });

  // Sort by date descending (most recent first)
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (events.length === 0) {
    return (
      <GlassCard>
        <EmptyState
          icon={Clock}
          title="No timeline events"
          description="Membership events will appear here as members join or leave the group."
          size="sm"
        />
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-[var(--color-secondary-light)]" />
        Membership Timeline
      </h3>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--glass-border)]" />

        {/* Events */}
        <div className="space-y-4">
          {events.map((event, index) => {
            const isJoin = event.type === "joined";

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06, duration: 0.3 }}
                className="flex items-start gap-3 relative"
              >
                {/* Dot */}
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 z-10",
                  isJoin
                    ? "bg-[var(--color-success-ghost)] text-[var(--color-success-light)]"
                    : "bg-[var(--color-danger-ghost)] text-[var(--color-danger-light)]"
                )}>
                  {isJoin ? (
                    <UserPlus className="h-3 w-3" />
                  ) : (
                    <UserMinus className="h-3 w-3" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-1">
                  <p className="text-sm text-[var(--color-text-primary)]">
                    <span className="font-medium">{event.userId.slice(0, 12)}...</span>
                    {" "}
                    {isJoin ? "joined" : "left"} as{" "}
                    <span className="text-[var(--color-text-secondary)]">{event.role}</span>
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
