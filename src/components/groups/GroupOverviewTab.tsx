/**
 * src/components/groups/GroupOverviewTab.tsx — Group Overview Tab
 *
 * Summary KPIs, balance explorer, and membership timeline.
 */

"use client";

import { useEffect, useRef } from "react";
import { DollarSign, Users, ArrowLeftRight, TrendingUp } from "lucide-react";
import { useGroup, useGroupExpenses, useGroupBalances, useGroupMembers } from "@/lib/hooks/use-groups";
import { KpiCard } from "@/components/ui/KpiCard";
import { GroupBalanceExplorer } from "@/components/groups/GroupBalanceExplorer";
import { MembershipTimeline } from "@/components/groups/MembershipTimeline";
import { formatMoney } from "@/lib/utils/format-money";

interface GroupOverviewTabProps {
  groupId: string;
  focusBalances?: boolean;
  onBalanceFocusHandled?: () => void;
}

export function GroupOverviewTab({
  groupId,
  focusBalances = false,
  onBalanceFocusHandled,
}: GroupOverviewTabProps) {
  const balanceRef = useRef<HTMLDivElement>(null);
  const { data: groupData, isLoading: isGroupLoading } = useGroup(groupId);
  const { data: expensesData, isLoading: isExpensesLoading } = useGroupExpenses(groupId);
  const { data: balancesData, isLoading: isBalancesLoading } = useGroupBalances(groupId);
  const { data: membersData, isLoading: isMembersLoading } = useGroupMembers(groupId);

  const expenses = expensesData?.expenses ?? [];
  const balances = balancesData?.balances?.members ?? [];
  const members = membersData?.members ?? [];
  const currency = groupData?.group?.currency ?? "USD";

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + parseFloat(e.baseAmount || "0"),
    0
  );
  const activeMembers = members.filter((m) => m.isActive);
  const pendingSettlements = balances.filter(
    (b) => b.netBalance !== 0
  ).length;

  const isLoading = isGroupLoading || isExpensesLoading || isBalancesLoading || isMembersLoading;

  useEffect(() => {
    if (!focusBalances || isLoading) return;

    const frame = requestAnimationFrame(() => {
      balanceRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      onBalanceFocusHandled?.();
    });

    return () => cancelAnimationFrame(frame);
  }, [focusBalances, isLoading, onBalanceFocusHandled]);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Expenses"
          value={formatMoney(totalExpenses, currency)}
          icon={DollarSign}
          loading={isLoading}
        />
        <KpiCard
          label="Active Members"
          value={String(activeMembers.length)}
          icon={Users}
          loading={isLoading}
        />
        <KpiCard
          label="Unsettled"
          value={String(pendingSettlements)}
          icon={ArrowLeftRight}
          loading={isLoading}
        />
        <KpiCard
          label="Transactions"
          value={String(expenses.length)}
          icon={TrendingUp}
          loading={isLoading}
        />
      </div>

      {/* Balance Explorer */}
      <div id="balance-overview" ref={balanceRef}>
        <GroupBalanceExplorer groupId={groupId} highlighted={focusBalances && !isLoading} />
      </div>

      {/* Membership Timeline */}
      <MembershipTimeline groupId={groupId} />
    </div>
  );
}
