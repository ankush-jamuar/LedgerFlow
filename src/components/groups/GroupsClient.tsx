/**
 * src/components/groups/GroupsClient.tsx — Groups Listing Client Shell
 *
 * Fetches the user's groups, renders search/filter controls,
 * and displays groups in a responsive card grid.
 */

"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Users } from "lucide-react";
import { useGroups } from "@/lib/hooks/use-groups";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";

type FilterTab = "all" | "active" | "archived";

const FILTER_TABS = [
  { id: "all" as const, label: "All" },
  { id: "active" as const, label: "Active" },
  { id: "archived" as const, label: "Archived" },
];

export function GroupsClient() {
  const { data, isLoading, error, refetch } = useGroups();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const groups = useMemo(() => data?.groups ?? [], [data?.groups]);

  const filteredGroups = useMemo(() => {
    let result = groups;

    // Apply filter
    if (filter === "active") {
      result = result.filter((g) => !g.isArchived);
    } else if (filter === "archived") {
      result = result.filter((g) => g.isArchived);
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [groups, filter, search]);

  // Tab counts
  const tabsWithCounts = FILTER_TABS.map((tab) => ({
    ...tab,
    count:
      tab.id === "all"
        ? groups.length
        : tab.id === "active"
        ? groups.filter((g) => !g.isArchived).length
        : groups.filter((g) => g.isArchived).length,
  }));

  if (error) {
    return (
      <ErrorState
        title="Could not load groups"
        message="We encountered an issue loading your groups. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text-primary)] text-sm pl-9 pr-3 py-2 placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
              id="groups-search"
            />
          </div>

          {!isLoading && groups.length > 0 && (
            <Tabs
              tabs={tabsWithCounts}
              activeTab={filter}
              onTabChange={(id) => setFilter(id as FilterTab)}
              variant="pill"
            />
          )}
        </div>

        {/* Create button */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreateModal(true)}
          id="create-group-btn"
        >
          New Group
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
              <div className="pt-3 border-t border-[var(--glass-border)] flex justify-between items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-7 w-7" rounded />
                  ))}
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        groups.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No groups yet"
            description="Create your first group to start tracking shared expenses with your team, roommates, or travel buddies."
            action={
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowCreateModal(true)}
              >
                Create Your First Group
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No matching groups"
            description={`No groups match "${search}". Try adjusting your search or filter.`}
            size="sm"
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group, index) => (
            <GroupCard key={group.id} group={group} index={index} />
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
