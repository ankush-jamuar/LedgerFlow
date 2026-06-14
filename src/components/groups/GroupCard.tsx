/**
 * src/components/groups/GroupCard.tsx — Group Card in Listing Grid
 *
 * Glassmorphism card showing group summary: name, description,
 * member avatars, total members, currency badge. Links to detail page.
 */

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Globe } from "lucide-react";
import type { GroupResponse } from "@/lib/api/client";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";

interface GroupCardProps {
  group: GroupResponse;
  index: number;
}

export function GroupCard({ group, index }: GroupCardProps) {
  const activeMembers = group.memberships?.filter((m) => m.isActive) ?? [];
  const displayAvatars = activeMembers.slice(0, 4);
  const overflowCount = Math.max(0, activeMembers.length - 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <Link
        href={`/groups/${group.id}`}
        className={cn(
          "group block glass rounded-xl p-5 h-full",
          "transition-all duration-200",
          "hover:border-[var(--glass-border-hover)] hover:shadow-[0_8px_32px_rgba(124,58,237,0.1)]",
          "hover:-translate-y-0.5",
          group.isArchived && "opacity-60"
        )}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-primary-light)] transition-colors">
              {group.name}
            </h3>
            {group.description && (
              <p className="mt-1 text-xs text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">
                {group.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {group.isArchived && (
              <Badge variant="warning" size="sm">Archived</Badge>
            )}
            <Badge variant="default" size="sm">
              <Globe className="h-3 w-3 mr-0.5" />
              {group.currency}
            </Badge>
          </div>
        </div>

        {/* Member avatars + count */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--glass-border)]">
          <div className="flex items-center gap-2">
            {/* Avatar stack */}
            <div className="flex -space-x-2">
              {displayAvatars.map((member) => (
                <div
                  key={member.id}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-ghost)] border-2 border-[var(--color-brand-surface)] text-[10px] font-semibold text-[var(--color-primary-light)] uppercase"
                  title={member.user?.email || member.user?.username || member.userId}
                >
                  {(member.user?.email?.[0] || member.user?.username?.[0] || "?").toUpperCase()}
                </div>
              ))}
              {overflowCount > 0 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] border-2 border-[var(--color-brand-surface)] text-[10px] font-medium text-[var(--color-text-muted)]">
                  +{overflowCount}
                </div>
              )}
            </div>

            <span className="text-xs text-[var(--color-text-muted)]">
              <Users className="h-3 w-3 inline mr-1" />
              {activeMembers.length} {activeMembers.length === 1 ? "member" : "members"}
            </span>
          </div>

          {/* Created date */}
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {new Date(group.createdAt).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
