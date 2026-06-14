/**
 * src/components/groups/GroupSettlementsTab.tsx — Group Settlements Tab
 *
 * Displays settlement history for the group.
 */

"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useGroupSettlements, useGroupMembers } from "@/lib/hooks/use-groups";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRow } from "@/components/ui/Skeleton";

interface GroupSettlementsTabProps {
  groupId: string;
}

export function GroupSettlementsTab({ groupId }: GroupSettlementsTabProps) {
  const { data, isLoading, error, refetch } = useGroupSettlements(groupId);
  const { data: membersData } = useGroupMembers(groupId);

  if (error) {
    return (
      <ErrorState
        title="Could not load settlements"
        message="Failed to load settlement history. Please try again."
        onRetry={() => refetch()}
        size="sm"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="glass rounded-xl overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  const settlements = data?.settlements ?? [];
  const members = membersData?.members ?? [];

  const getMemberName = (userId: string) => {
    const member = members.find((m) => m.userId === userId);
    return member?.user?.username || member?.user?.email?.split("@")[0] || userId.slice(0, 8);
  };

  if (settlements.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="All settled up!"
        description="No settlements have been recorded yet. When members settle debts, they'll appear here."
        size="sm"
      />
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--glass-border)] text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
        <span className="flex-1">Settlement</span>
        <span className="w-28 text-right">Amount</span>
      </div>

      {/* Rows */}
      {settlements.map((settlement, index) => (
        <motion.div
          key={settlement.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.03 }}
          className="flex items-center gap-3 px-4 py-3 border-b border-[var(--glass-border)] last:border-0 hover:bg-white/[0.02] transition-colors"
        >
          {/* Icon */}
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-success-ghost)]">
            <CheckCircle2 className="h-4 w-4 text-[var(--color-success-light)]" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-[var(--color-text-primary)] truncate">
                {getMemberName(settlement.payerId)}
              </span>
              <ArrowRight className="h-3 w-3 text-[var(--color-text-muted)] flex-shrink-0" />
              <span className="font-medium text-[var(--color-text-primary)] truncate">
                {getMemberName(settlement.receiverId)}
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              {new Date(settlement.settledAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              {settlement.note && ` · ${settlement.note}`}
            </p>
          </div>

          {/* Amount */}
          <span className="w-28 text-right text-sm font-semibold text-[var(--color-success-light)]">
            {settlement.originalCurrency} {parseFloat(settlement.originalAmount).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
