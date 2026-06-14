/**
 * src/components/expenses/ExpensesClient.tsx — Global Expenses Listing client
 *
 * Flattens expenses across all accessible groups, providing filters,
 * search, sorting, and detail page navigation.
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Receipt, ArrowUpDown } from "lucide-react";
import { useGroups } from "@/lib/hooks/use-groups";
import { useQueries } from "@tanstack/react-query";
import { api, type ExpenseResponse } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { CreateExpenseModal } from "@/components/expenses/CreateExpenseModal";
import { formatMoney } from "@/lib/utils/format-money";

type SortField = "date" | "amount" | "description";
type SortOrder = "asc" | "desc";

export function ExpensesClient() {
  const { data: groupsData, isLoading: isGroupsLoading, error: groupsError, refetch: refetchGroups } = useGroups();
  const groups = useMemo(() => groupsData?.groups ?? [], [groupsData?.groups]);

  // Fetch expenses for each group in parallel
  const expensesQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: ["groups", group.id, "expenses"],
      queryFn: () => api.groups.expenses(group.id),
      staleTime: 30 * 1000,
    })),
  });

  const isExpensesLoading = expensesQueries.some((q) => q.isLoading);
  const isError = groupsError || expensesQueries.some((q) => q.error);

  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedSplitType, setSelectedSplitType] = useState("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Flatten and join expense records with group details
  const flattenedExpenses = useMemo(() => {
    const list: (ExpenseResponse & { groupName: string; groupCurrency: string })[] = [];
    expensesQueries.forEach((query, index) => {
      const group = groups[index];
      if (query.data?.expenses && group) {
        query.data.expenses.forEach((expense) => {
          list.push({
            ...expense,
            groupName: group.name,
            groupCurrency: group.currency,
          });
        });
      }
    });
    return list;
  }, [expensesQueries, groups]);

  // Apply filters, search, and sorting
  const processedExpenses = useMemo(() => {
    let result = [...flattenedExpenses];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.groupName.toLowerCase().includes(q)
      );
    }

    // Group Filter
    if (selectedGroup !== "all") {
      result = result.filter((e) => e.groupId === selectedGroup);
    }

    // Split Type Filter
    if (selectedSplitType !== "all") {
      result = result.filter((e) => e.splitType === selectedSplitType);
    }

    // Date Filter
    if (selectedDateFilter !== "all") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      result = result.filter((e) => {
        const expenseDate = new Date(e.date);
        if (selectedDateFilter === "this-month") {
          return expenseDate >= startOfMonth;
        }
        if (selectedDateFilter === "last-month") {
          return expenseDate >= startOfLastMonth && expenseDate < startOfMonth;
        }
        if (selectedDateFilter === "older") {
          return expenseDate < startOfLastMonth;
        }
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === "amount") {
        comparison = parseFloat(a.originalAmount) - parseFloat(b.originalAmount);
      } else if (sortField === "description") {
        comparison = a.description.localeCompare(b.description);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [flattenedExpenses, search, selectedGroup, selectedSplitType, selectedDateFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const refetchAll = () => {
    void refetchGroups();
    expensesQueries.forEach((q) => q.refetch());
  };

  if (isError) {
    return (
      <ErrorState
        title="Could not load expenses"
        message="We encountered an issue loading your global expenses registry. Please try again."
        onRetry={refetchAll}
      />
    );
  }

  const isLoading = isGroupsLoading || isExpensesLoading;

  return (
    <div className="space-y-6">
      {/* Controls row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Multi-Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text-primary)] text-sm pl-9 pr-3 py-2 placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
              id="expenses-search"
            />
          </div>

          {/* Group Filter */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text-primary)] text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all cursor-pointer"
          >
            <option value="all">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Split Type Filter */}
          <select
            value={selectedSplitType}
            onChange={(e) => setSelectedSplitType(e.target.value)}
            className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text-primary)] text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all cursor-pointer"
          >
            <option value="all">All Splits</option>
            <option value="EQUAL">Equally</option>
            <option value="EXACT">Exact Amounts</option>
            <option value="PERCENTAGE">Percentages</option>
            <option value="SHARES">Shares</option>
          </select>

          {/* Date Filter */}
          <select
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text-primary)] text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="older">Older</option>
          </select>
        </div>

        {/* Add expense button */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreateModal(true)}
          disabled={groups.length === 0}
          id="expenses-add-btn"
        >
          Add Expense
        </Button>
      </div>

      {/* Expenses Table */}
      {isLoading ? (
        <div className="glass rounded-xl overflow-hidden divide-y divide-[var(--glass-border)]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 flex justify-between gap-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      ) : processedExpenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={flattenedExpenses.length === 0 ? "No expenses recorded" : "No matching expenses"}
          description={
            flattenedExpenses.length === 0
              ? "You haven't logged any shared expenses yet. Select 'Add Expense' to get started."
              : "No expenses match your active filter queries. Try resetting some filters."
          }
          action={
            flattenedExpenses.length === 0 && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowCreateModal(true)}
              >
                Add Your First Expense
              </Button>
            )
          }
        />
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          {/* Table headers */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--glass-border)] text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] select-none">
            <button
              onClick={() => handleSort("description")}
              className="flex-1 flex items-center gap-1 hover:text-[var(--color-text-primary)] transition-colors focus:outline-none cursor-pointer"
            >
              Expense <ArrowUpDown className="h-3 w-3" />
            </button>
            <span className="w-40 hidden lg:block">Group</span>
            <button
              onClick={() => handleSort("date")}
              className="w-28 flex items-center gap-1 justify-end hover:text-[var(--color-text-primary)] transition-colors focus:outline-none cursor-pointer hidden sm:flex"
            >
              Date <ArrowUpDown className="h-3 w-3" />
            </button>
            <span className="w-24 text-right hidden md:block">Split</span>
            <button
              onClick={() => handleSort("amount")}
              className="w-32 flex items-center gap-1 justify-end hover:text-[var(--color-text-primary)] transition-colors focus:outline-none cursor-pointer"
            >
              Amount <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-[var(--glass-border)]">
            {processedExpenses.map((expense) => (
              <Link
                key={expense.id}
                href={`/expenses/${expense.id}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                {/* Description */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                    {expense.description}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 sm:hidden">
                    {new Date(expense.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Group */}
                <div className="w-40 hidden lg:block truncate">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                    {expense.groupName}
                  </span>
                </div>

                {/* Date */}
                <div className="w-28 text-right text-xs text-[var(--color-text-secondary)] hidden sm:block">
                  {new Date(expense.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                {/* Split badge */}
                <div className="w-24 text-right hidden md:flex justify-end">
                  <Badge variant="default" size="sm">
                    {expense.splitType}
                  </Badge>
                </div>

                {/* Amount */}
                <div className="w-32 text-right text-sm font-bold text-[var(--color-text-primary)]">
                  {formatMoney(expense.originalAmount, expense.originalCurrency)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateExpenseModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
