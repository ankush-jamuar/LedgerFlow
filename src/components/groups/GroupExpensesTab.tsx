/**
 * src/components/groups/GroupExpensesTab.tsx — Group Expenses Tab
 *
 * Displays a list of all expenses for the group.
 */

"use client";

import { motion } from "framer-motion";
import { Receipt } from "lucide-react";
import { useGroupExpenses, useGroupMembers } from "@/lib/hooks/use-groups";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { SkeletonRow } from "@/components/ui/Skeleton";

interface GroupExpensesTabProps {
  groupId: string;
}

export function GroupExpensesTab({ groupId }: GroupExpensesTabProps) {
  const { data, isLoading, error, refetch } = useGroupExpenses(groupId);
  const { data: membersData } = useGroupMembers(groupId);

  if (error) {
    return (
      <ErrorState
        title="Could not load expenses"
        message="Failed to load group expenses. Please try again."
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

  const expenses = data?.expenses ?? [];
  const members = membersData?.members ?? [];

  const getMemberName = (userId: string) => {
    const member = members.find((m) => m.userId === userId);
    return member?.user?.username || member?.user?.email?.split("@")[0] || userId.slice(0, 8);
  };

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No expenses yet"
        description="Expenses added to this group will appear here. Add your first expense to get started."
        size="sm"
      />
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--glass-border)] text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
        <span className="flex-1">Expense</span>
        <span className="w-24 text-right hidden sm:block">Paid By</span>
        <span className="w-20 text-right hidden md:block">Split</span>
        <span className="w-28 text-right">Amount</span>
      </div>

      {/* Rows */}
      {expenses.map((expense, index) => (
        <motion.div
          key={expense.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.03 }}
          className="flex items-center gap-3 px-4 py-3 border-b border-[var(--glass-border)] last:border-0 hover:bg-white/[0.02] transition-colors"
        >
          {/* Icon + info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-ghost)]">
              <Receipt className="h-4 w-4 text-[var(--color-primary-light)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {expense.description}
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {new Date(expense.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Paid by */}
          <span className="w-24 text-right text-xs text-[var(--color-text-secondary)] truncate hidden sm:block">
            {getMemberName(expense.paidById)}
          </span>

          {/* Split type */}
          <div className="w-20 text-right hidden md:flex justify-end">
            <Badge variant="default" size="sm">
              {expense.splitType}
            </Badge>
          </div>

          {/* Amount */}
          <span className="w-28 text-right text-sm font-semibold text-[var(--color-text-primary)]">
            {expense.originalCurrency} {parseFloat(expense.originalAmount).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
