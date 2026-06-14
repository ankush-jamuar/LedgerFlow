/**
 * src/components/groups/GroupBalanceExplorer.tsx — Visual Balance Display
 *
 * Shows who owes whom in the group with color-coded net balances.
 * Green = is owed, Red = owes. Includes simplified debt arrows.
 */

"use client";

import { motion } from "framer-motion";
import { Scale, ArrowRight } from "lucide-react";
import { useGroup, useGroupBalances, useGroupMembers } from "@/lib/hooks/use-groups";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

interface GroupBalanceExplorerProps {
  groupId: string;
}

export function GroupBalanceExplorer({ groupId }: GroupBalanceExplorerProps) {
  const { data: groupData } = useGroup(groupId);
  const { data: balancesData, isLoading: isBalancesLoading } = useGroupBalances(groupId);
  const { data: membersData, isLoading: isMembersLoading } = useGroupMembers(groupId);

  const isLoading = isBalancesLoading || isMembersLoading;
  const memberBalances = balancesData?.balances?.members ?? [];
  const debts = balancesData?.balances?.whoOwesWhom ?? [];
  const members = membersData?.members ?? [];
  const currency = groupData?.group?.currency ?? "USD";

  const getMemberName = (userId: string) => {
    const member = members.find((m) => m.userId === userId);
    return member?.user?.username || member?.user?.email?.split("@")[0] || userId.slice(0, 8);
  };

  if (isLoading) {
    return (
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8" rounded />
              <Skeleton className="h-3 w-24 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (memberBalances.length === 0) {
    return (
      <GlassCard>
        <EmptyState
          icon={Scale}
          title="No balances"
          description="Balances will appear here once expenses are added."
          size="sm"
        />
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
        <Scale className="h-4 w-4 text-[var(--color-primary-light)]" />
        Balance Overview
      </h3>

      {/* Net balances */}
      <div className="space-y-2 mb-6">
        {memberBalances.map((balance, index) => {
          const net = balance.netBalance;
          const isPositive = net > 0;
          const isZero = net === 0;

          return (
            <motion.div
              key={balance.userId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 py-2"
            >
              {/* Avatar */}
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0",
                isPositive ? "bg-[var(--color-success-ghost)] text-[var(--color-success-light)]"
                  : isZero ? "bg-white/[0.04] text-[var(--color-text-muted)]"
                  : "bg-[var(--color-danger-ghost)] text-[var(--color-danger-light)]"
              )}>
                {getMemberName(balance.userId)[0]?.toUpperCase() ?? "?"}
              </div>

              {/* Name */}
              <span className="text-sm text-[var(--color-text-primary)] flex-1 truncate">
                {getMemberName(balance.userId)}
              </span>

              {/* Balance */}
              <span className={cn(
                "text-sm font-semibold",
                isPositive ? "text-[var(--color-success-light)]"
                  : isZero ? "text-[var(--color-text-muted)]"
                  : "text-[var(--color-danger-light)]"
              )}>
                {isPositive ? "+" : ""}{balance.netBalance.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Debt arrows — simplified settlements */}
      {debts.length > 0 && (
        <div className="border-t border-[var(--glass-border)] pt-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
            Simplified Debts
          </h4>
          <div className="space-y-2">
            {debts.map((debt, i) => (
              <motion.div
                key={`${debt.payerId}-${debt.receiverId}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg bg-white/[0.02]"
              >
                <span className="text-[var(--color-danger-light)] font-medium truncate">
                  {getMemberName(debt.payerId)}
                </span>
                <ArrowRight className="h-3 w-3 text-[var(--color-text-muted)] flex-shrink-0" />
                <span className="text-[var(--color-success-light)] font-medium truncate">
                  {getMemberName(debt.receiverId)}
                </span>
                <span className="ml-auto text-xs font-semibold text-[var(--color-text-primary)]">
                  {currency} {debt.amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
