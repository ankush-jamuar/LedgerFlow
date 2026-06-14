/**
 * src/components/groups/GroupDetailClient.tsx — Group Detail Client Shell
 *
 * Fetches group data, renders the group header with quick actions,
 * and a tabbed layout: Overview, Expenses, Settlements, Members.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Receipt,
  ArrowLeftRight,
  Upload,
  Scale,
  Users,
  Globe,
  Calendar,
} from "lucide-react";
import { useGroup } from "@/lib/hooks/use-groups";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { GroupOverviewTab } from "@/components/groups/GroupOverviewTab";
import { GroupExpensesTab } from "@/components/groups/GroupExpensesTab";
import { GroupSettlementsTab } from "@/components/groups/GroupSettlementsTab";
import { GroupMembersTab } from "@/components/groups/GroupMembersTab";
import { AddMemberModal } from "@/components/groups/AddMemberModal";
import { CreateExpenseModal } from "@/components/expenses/CreateExpenseModal";
import { RecordSettlementModal } from "@/components/settlements/RecordSettlementModal";
import { cn } from "@/lib/utils/cn";

interface GroupDetailClientProps {
  groupId: string;
}

type TabId = "overview" | "expenses" | "settlements" | "members";

const TABS = [
  { id: "overview" as const, label: "Overview", icon: <Scale className="h-3.5 w-3.5" /> },
  { id: "expenses" as const, label: "Expenses", icon: <Receipt className="h-3.5 w-3.5" /> },
  { id: "settlements" as const, label: "Settlements", icon: <ArrowLeftRight className="h-3.5 w-3.5" /> },
  { id: "members" as const, label: "Members", icon: <Users className="h-3.5 w-3.5" /> },
];

const QUICK_ACTIONS = [
  {
    label: "Add Expense",
    icon: Receipt,
    gradient: "from-violet-500 to-purple-600",
    glow: "rgba(124, 58, 237, 0.2)",
  },
  {
    label: "Record Settlement",
    icon: ArrowLeftRight,
    gradient: "from-emerald-500 to-teal-600",
    glow: "rgba(16, 185, 129, 0.2)",
  },
  {
    label: "Import CSV",
    icon: Upload,
    gradient: "from-cyan-500 to-blue-600",
    glow: "rgba(6, 182, 212, 0.2)",
  },
  {
    label: "View Balances",
    icon: Scale,
    gradient: "from-amber-500 to-orange-600",
    glow: "rgba(245, 158, 11, 0.2)",
  },
];

export function GroupDetailClient({ groupId }: GroupDetailClientProps) {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGroup(groupId);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Modals state
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showRecordSettlement, setShowRecordSettlement] = useState(false);

  if (error) {
    return (
      <ErrorState
        title="Group not found"
        message="This group doesn't exist or you don't have access to it."
        onRetry={() => refetch()}
      />
    );
  }

  const group = data?.group;

  const handleQuickAction = (label: string) => {
    if (label === "Add Expense") {
      setShowAddExpense(true);
    } else if (label === "Record Settlement") {
      setShowRecordSettlement(true);
    } else if (label === "Import CSV") {
      router.push(`/import?groupId=${groupId}`);
    } else if (label === "View Balances") {
      setActiveTab("overview");
      setTimeout(() => {
        const el = document.getElementById("balance-overview");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/groups"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Groups
      </Link>

      {/* Header */}
      {isLoading || !group ? (
        <div className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
                {group.name}
              </h1>
              {group.description && (
                <p className="mt-1 text-sm text-[var(--color-text-secondary)] max-w-xl">
                  {group.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="default" size="sm">
                  <Globe className="h-3 w-3 mr-0.5" />
                  {group.currency}
                </Badge>
                <Badge variant="primary" size="sm" dot>
                  {group.memberships?.filter((m) => m.isActive).length ?? 0} members
                </Badge>
                {group.isArchived && (
                  <Badge variant="warning" size="sm">Archived</Badge>
                )}
                <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created {new Date(group.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
              onClick={() => handleQuickAction(action.label)}
              className={cn(
                "glass flex flex-col items-center gap-2 rounded-xl p-4 w-full text-center",
                "hover:border-[var(--glass-border-hover)] transition-all duration-200",
                "hover:-translate-y-0.5 group cursor-pointer"
              )}
              style={{ boxShadow: `0 0 0 0 ${action.glow}` }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${action.glow}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${action.glow}`;
              }}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br",
                action.gradient,
                "shadow-lg transition-transform group-hover:scale-105"
              )}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Tab Bar */}
      <Tabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
        variant="pill"
      />

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "overview" && <GroupOverviewTab groupId={groupId} />}
        {activeTab === "expenses" && <GroupExpensesTab groupId={groupId} />}
        {activeTab === "settlements" && <GroupSettlementsTab groupId={groupId} />}
        {activeTab === "members" && (
          <GroupMembersTab
            groupId={groupId}
            onAddMember={() => setShowAddMember(true)}
          />
        )}
      </div>

      {/* Modals */}
      <AddMemberModal
        groupId={groupId}
        open={showAddMember}
        onClose={() => setShowAddMember(false)}
      />

      <CreateExpenseModal
        groupId={groupId}
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
      />

      <RecordSettlementModal
        groupId={groupId}
        open={showRecordSettlement}
        onClose={() => setShowRecordSettlement(false)}
      />
    </div>
  );
}
