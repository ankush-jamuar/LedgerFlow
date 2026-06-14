/**
 * src/components/settlements/SettlementsClient.tsx — Global Settlements, Balances & SVG Debt Graph Client
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQueries } from "@tanstack/react-query";
import { Plus, Search, HelpCircle, ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react";
import { useGroups } from "@/lib/hooks/use-groups";
import { api, type SettlementResponse } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatMoney } from "@/lib/utils/format-money";
import { RecordSettlementModal } from "@/components/settlements/RecordSettlementModal";

export function SettlementsClient() {
  const { userId: currentUserId } = useAuth();
  const { data: groupsData, isLoading: isGroupsLoading, error: groupsError, refetch: refetchGroups } = useGroups();
  const groups = useMemo(() => groupsData?.groups ?? [], [groupsData?.groups]);

  // Fetch settlements and balances for each group in parallel
  const settlementsQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: ["groups", group.id, "settlements"],
      queryFn: () => api.groups.settlements(group.id),
      staleTime: 30 * 1000,
    })),
  });

  const balancesQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: ["groups", group.id, "balances"],
      queryFn: () => api.groups.balances(group.id),
      staleTime: 15 * 1000,
    })),
  });

  const isDataLoading =
    isGroupsLoading ||
    settlementsQueries.some((q) => q.isLoading) ||
    balancesQueries.some((q) => q.isLoading);

  const isError =
    groupsError ||
    settlementsQueries.some((q) => q.error) ||
    balancesQueries.some((q) => q.error);

  const [activeTab, setActiveTab] = useState("explorer");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [explorerGroupId, setExplorerGroupId] = useState("");
  const [search, setSearch] = useState("");
  const [showRecordModal, setShowRecordModal] = useState(false);

  const activeGroupId = explorerGroupId || groups[0]?.id || "";

  // Flatten settlement history
  const flattenedSettlements = useMemo(() => {
    const list: (SettlementResponse & { groupName: string })[] = [];
    settlementsQueries.forEach((query, index) => {
      const group = groups[index];
      if (query.data?.settlements && group) {
        query.data.settlements.forEach((s) => {
          list.push({
            ...s,
            groupName: group.name,
          });
        });
      }
    });
    // Sort by settledAt descending
    list.sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime());
    return list;
  }, [settlementsQueries, groups]);

  // Filter history settlements
  const filteredSettlements = useMemo(() => {
    let result = [...flattenedSettlements];

    if (selectedGroupId !== "all") {
      result = result.filter((s) => s.groupId === selectedGroupId);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => {
        const payerName = s.payer?.username?.toLowerCase() || s.payer?.email?.toLowerCase() || "";
        const receiverName = s.receiver?.username?.toLowerCase() || s.receiver?.email?.toLowerCase() || "";
        const note = s.note?.toLowerCase() || "";
        return payerName.includes(q) || receiverName.includes(q) || note.includes(q);
      });
    }

    return result;
  }, [flattenedSettlements, selectedGroupId, search]);

  // Global user summary across all groups
  const userOwedSummary = useMemo(() => {
    let totalOwed = 0; // you owe others (payable)
    let totalReceivable = 0; // others owe you (receivable)
    const currencies = new Set<string>();

    balancesQueries.forEach((query, index) => {
      const group = groups[index];
      const balances = query.data?.balances;
      if (balances && group && currentUserId) {
        const userBalance = balances.members.find((m) => m.userId === currentUserId);
        if (userBalance) {
          // netBalance > 0: Group owes you (receivable)
          // netBalance < 0: You owe the group (payable)
          const net = userBalance.netBalance;
          if (net > 0) {
            totalReceivable += net;
          } else if (net < 0) {
            totalOwed += Math.abs(net);
          }
          currencies.add(group.currency);
        }
      }
    });

    const currencySymbol = currencies.size === 1 ? Array.from(currencies)[0] : "USD";

    return {
      totalOwed,
      totalReceivable,
      netBalance: totalReceivable - totalOwed,
      currencySymbol,
    };
  }, [balancesQueries, groups, currentUserId]);

  const activeExplorerData = useMemo(() => {
    const idx = groups.findIndex((g) => g.id === activeGroupId);
    if (idx === -1) return null;

    const group = groups[idx];
    const balanceData = balancesQueries[idx]?.data?.balances;

    return {
      group,
      balances: balanceData,
    };
  }, [activeGroupId, groups, balancesQueries]);

  // SVG circular layout generation for Debt Graph
  const svgGraphContent = useMemo(() => {
    if (!activeExplorerData?.balances) return null;
    const { balances, group } = activeExplorerData;

    // Filter members who are active or have transactions
    const nodes = balances.members.map((m) => {
      const idx = group.memberships.findIndex((ms) => ms.userId === m.userId);
      const membership = group.memberships[idx];
      const username = membership?.user?.username || membership?.user?.email?.split("@")[0] || m.userId.slice(0, 8);
      const imageUrl = membership?.user?.imageUrl || null;
      return {
        userId: m.userId,
        name: username,
        imageUrl,
        netBalance: m.netBalance,
      };
    });

    const numNodes = nodes.length;
    if (numNodes === 0) return null;

    // Graph Dimensions
    const size = 380;
    const cx = size / 2;
    const cy = size / 2;
    const r = 110; // circle radius for node placement

    // Map each member to an angle and point on the circle
    const nodePositions = nodes.map((node, i) => {
      const angle = (i * 2 * Math.PI) / numNodes - Math.PI / 2; // Start from top
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return {
        ...node,
        x,
        y,
        angle,
      };
    });

    // Debts (arrows / directional relationships)
    const links = balances.whoOwesWhom.map((debt) => {
      const payer = nodePositions.find((n) => n.userId === debt.payerId);
      const receiver = nodePositions.find((n) => n.userId === debt.receiverId);
      return {
        payer,
        receiver,
        amount: debt.amount,
      };
    });

    return {
      size,
      cx,
      cy,
      nodes: nodePositions,
      links,
      currency: group.currency,
    };
  }, [activeExplorerData]);

  const handleRefetch = () => {
    void refetchGroups();
    settlementsQueries.forEach((q) => q.refetch());
    balancesQueries.forEach((q) => q.refetch());
  };

  if (isError) {
    return (
      <ErrorState
        title="Could not load settlements"
        message="An issue occurred pulling your settlements ledger and balance sheets. Please try again."
        onRetry={handleRefetch}
      />
    );
  }

  const tabs = [
    { id: "explorer", label: "Balance Explorer & Debt Graph" },
    { id: "history", label: "Settlement History" },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards (Only loaded if not main loading state) */}
      {!isDataLoading && groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Total Receivable
              </p>
              <h3 className="text-2xl font-bold text-[var(--color-success-light)] mt-1">
                {formatMoney(userOwedSummary.totalReceivable, userOwedSummary.currencySymbol)}
              </h3>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                Amounts owed to you by others
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[var(--color-success-ghost)] flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-[var(--color-success-light)]" />
            </div>
          </div>

          <div className="glass rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Total Payable
              </p>
              <h3 className="text-2xl font-bold text-[var(--color-danger-light)] mt-1">
                {formatMoney(userOwedSummary.totalOwed, userOwedSummary.currencySymbol)}
              </h3>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                Amounts you owe to other members
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[var(--color-danger-ghost)] flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-[var(--color-danger-light)]" />
            </div>
          </div>

          <div className="glass rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Net Standings
              </p>
              <h3
                className={`text-2xl font-bold mt-1 ${
                  userOwedSummary.netBalance > 0
                    ? "text-[var(--color-success-light)]"
                    : userOwedSummary.netBalance < 0
                    ? "text-[var(--color-danger-light)]"
                    : "text-[var(--color-text-primary)]"
                }`}
              >
                {userOwedSummary.netBalance >= 0 ? "+" : ""}
                {formatMoney(userOwedSummary.netBalance, userOwedSummary.currencySymbol)}
              </h3>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                Combined balance sheet value
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/[0.04]">
              <ArrowRightLeft className="h-5 w-5 text-[var(--color-text-secondary)]" />
            </div>
          </div>
        </div>
      )}

      {/* Primary Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--glass-border)] pb-2">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        {!isGroupsLoading && groups.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowRecordModal(true)}
            id="settlements-add-btn"
          >
            Record Settlement
          </Button>
        )}
      </div>

      {/* Tabs View */}
      {isDataLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass h-96 rounded-xl animate-pulse" />
            <div className="glass h-96 rounded-xl animate-pulse" />
          </div>
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={ArrowRightLeft}
          title="No groups found"
          description="Create or join a group first to balance and settle expenses."
          action={
            <Link href="/groups">
              <Button variant="primary" size="sm">
                Go to Groups
              </Button>
            </Link>
          }
        />
      ) : activeTab === "explorer" ? (
        /* Balance Explorer Tab */
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Explore Group:
            </span>
            <select
              value={activeGroupId}
              onChange={(e) => setExplorerGroupId(e.target.value)}
              className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text-primary)] text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* SVG Debt Graph */}
            <div className="lg:col-span-3 glass rounded-xl p-6 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                  Visual Debt Graph
                </h3>
                <Tooltip content="Shows directional flows of money needed to settle up. Payers point to Receivers.">
                  <HelpCircle className="h-4 w-4 text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-text-secondary)]" />
                </Tooltip>
              </div>

              {svgGraphContent && svgGraphContent.nodes.length > 0 ? (
                <div className="relative border border-white/[0.02] bg-black/10 rounded-xl p-2 max-w-full">
                  <svg
                    width={svgGraphContent.size}
                    height={svgGraphContent.size}
                    viewBox={`0 0 ${svgGraphContent.size} ${svgGraphContent.size}`}
                    className="max-w-full select-none"
                  >
                    {/* Definitions for arrow marker */}
                    <defs>
                      <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="23" /* Offset so it points to outer edge of node circle */
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-primary-light)" />
                      </marker>
                    </defs>

                    {/* Background grid/flows */}
                    <circle
                      cx={svgGraphContent.cx}
                      cy={svgGraphContent.cy}
                      r="110"
                      fill="none"
                      stroke="white"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      className="opacity-[0.03]"
                    />

                    {/* Debt paths / arrows */}
                    {svgGraphContent.links.map((link, i) => {
                      if (!link.payer || !link.receiver) return null;
                      const { x: px, y: py } = link.payer;
                      const { x: rx, y: ry } = link.receiver;

                      // Draw arc curve slightly to prevent overlapping opposite directional paths
                      const dx = rx - px;
                      const dy = ry - py;
                      const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;

                      // Control curve direction
                      const pathData = `M${px},${py} A${dr},${dr} 0 0,1 ${rx},${ry}`;

                      // Midpoint for amount label
                      const mx = (px + rx) / 2 + dy * 0.12;
                      const my = (py + ry) / 2 - dx * 0.12;

                      return (
                        <g key={i} className="group">
                          <path
                            d={pathData}
                            fill="none"
                            stroke="var(--color-primary)"
                            strokeWidth="1.5"
                            className="opacity-40 group-hover:opacity-100 group-hover:stroke-width-2 transition-all"
                            markerEnd="url(#arrow)"
                          />
                          {/* Hover highlights amount */}
                          <g className="opacity-70 group-hover:opacity-100 transition-opacity">
                            <rect
                              x={mx - 32}
                              y={my - 8}
                              width="64"
                              height="16"
                              rx="4"
                              fill="#14151a"
                              stroke="var(--glass-border)"
                              strokeWidth="1"
                            />
                            <text
                              x={mx}
                              y={my + 3}
                              textAnchor="middle"
                              fill="var(--color-text-secondary)"
                              fontSize="8.5"
                              fontWeight="bold"
                            >
                              {formatMoney(link.amount, svgGraphContent.currency)}
                            </text>
                          </g>
                        </g>
                      );
                    })}

                    {/* Nodes (Members) */}
                    {svgGraphContent.nodes.map((node) => {
                      const isOwed = node.netBalance > 0;
                      const isOwer = node.netBalance < 0;

                      return (
                        <g key={node.userId} className="cursor-pointer">
                          {/* Inner Node Circle */}
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="16"
                            fill="#1a1c24"
                            stroke={
                              isOwed
                                ? "var(--color-success-light)"
                                : isOwer
                                ? "var(--color-danger-light)"
                                : "var(--glass-border)"
                            }
                            strokeWidth="1.5"
                            className="transition-colors duration-200"
                          />

                          {/* Image or initial */}
                          {node.imageUrl ? (
                            <clipPath id={`clip-${node.userId}`}>
                              <circle cx={node.x} cy={node.y} r="15" />
                            </clipPath>
                          ) : null}

                          {node.imageUrl ? (
                            <image
                              href={node.imageUrl}
                              x={node.x - 15}
                              y={node.y - 15}
                              width="30"
                              height="30"
                              clipPath={`url(#clip-${node.userId})`}
                              preserveAspectRatio="xMidYMid slice"
                            />
                          ) : (
                            <text
                              x={node.x}
                              y={node.y + 4}
                              textAnchor="middle"
                              fill="var(--color-text-primary)"
                              fontSize="10"
                              fontWeight="bold"
                            >
                              {node.name.slice(0, 2).toUpperCase()}
                            </text>
                          )}

                          {/* Node name label */}
                          <text
                            x={node.x}
                            y={node.y + 27}
                            textAnchor="middle"
                            fill="var(--color-text-secondary)"
                            fontSize="8"
                            fontWeight="medium"
                          >
                            {node.name}
                          </text>

                          {/* Balance mini label */}
                          {node.netBalance !== 0 && (
                            <text
                              x={node.x}
                              y={node.y - 21}
                              textAnchor="middle"
                              fill={isOwed ? "var(--color-success-light)" : "var(--color-danger-light)"}
                              fontSize="8"
                              fontWeight="bold"
                            >
                              {isOwed ? "+" : ""}
                              {formatMoney(node.netBalance, svgGraphContent.currency)}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              ) : (
                <div className="py-24 text-center text-xs text-[var(--color-text-muted)]">
                  Unable to load debt visualization.
                </div>
              )}
            </div>

            {/* Balances list / Who owes Whom */}
            <div className="lg:col-span-2 space-y-6">
              {/* Standings List */}
              <div className="glass rounded-xl p-5">
                <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
                  Group Standings
                </h3>

                {activeExplorerData?.balances?.members && activeExplorerData.balances.members.length > 0 ? (
                  <div className="space-y-4">
                    {activeExplorerData.balances.members.map((m) => {
                      const memberIdx = activeExplorerData.group.memberships.findIndex(
                        (ms) => ms.userId === m.userId
                      );
                      const membership = activeExplorerData.group.memberships[memberIdx];
                      const name =
                        membership?.user?.username ||
                        membership?.user?.email?.split("@")[0] ||
                        m.userId.slice(0, 8);

                      return (
                        <div key={m.userId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {membership?.user?.imageUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={membership.user.imageUrl}
                                alt={name}
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-[9px] font-bold text-[var(--color-text-secondary)]">
                                {name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="font-semibold text-[var(--color-text-secondary)]">
                              {name}
                            </span>
                          </div>

                          <div className="text-right">
                            <span
                              className={`font-bold ${
                                m.netBalance > 0
                                  ? "text-[var(--color-success-light)]"
                                  : m.netBalance < 0
                                  ? "text-[var(--color-danger-light)]"
                                  : "text-[var(--color-text-muted)]"
                              }`}
                            >
                              {m.netBalance > 0 ? "Owed " : m.netBalance < 0 ? "Owes " : "Settled"}
                              {m.netBalance !== 0 &&
                                formatMoney(Math.abs(m.netBalance), activeExplorerData.group.currency)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)] text-center py-4">
                    No member standings found.
                  </p>
                )}
              </div>

              {/* Simplified Debts suggestions */}
              <div className="glass rounded-xl p-5">
                <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
                  Simplified Transfers
                </h3>

                {activeExplorerData?.balances?.whoOwesWhom &&
                activeExplorerData.balances.whoOwesWhom.length > 0 ? (
                  <div className="space-y-3">
                    {activeExplorerData.balances.whoOwesWhom.map((debt, i) => {
                      const payerMs = activeExplorerData.group.memberships.find(
                        (ms) => ms.userId === debt.payerId
                      );
                      const receiverMs = activeExplorerData.group.memberships.find(
                        (ms) => ms.userId === debt.receiverId
                      );

                      const payerName =
                        payerMs?.user?.username || payerMs?.user?.email?.split("@")[0] || debt.payerId.slice(0, 8);
                      const receiverName =
                        receiverMs?.user?.username ||
                        receiverMs?.user?.email?.split("@")[0] ||
                        debt.receiverId.slice(0, 8);

                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs p-3 rounded-lg bg-white/[0.01] border border-white/[0.03]"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-[var(--color-text-primary)]">
                              {payerName}
                            </span>{" "}
                            <span className="text-[var(--color-text-muted)]">owes</span>{" "}
                            <span className="font-semibold text-[var(--color-text-primary)]">
                              {receiverName}
                            </span>
                          </div>
                          <div className="shrink-0 font-bold text-[var(--color-text-primary)] ml-2">
                            {formatMoney(debt.amount, activeExplorerData.group.currency)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-[var(--color-text-muted)]">
                    All debts are balanced. No transfers needed!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 flex-1">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search payer/receiver..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text-primary)] text-sm pl-9 pr-3 py-2 placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                  id="settlements-search"
                />
              </div>

              {/* Group filter */}
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text-primary)] text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all cursor-pointer"
              >
                <option value="all">All Groups</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* History Table */}
          {filteredSettlements.length === 0 ? (
            <EmptyState
              icon={ArrowRightLeft}
              title={flattenedSettlements.length === 0 ? "No settlements recorded" : "No matching settlements"}
              description={
                flattenedSettlements.length === 0
                  ? "Record a settlement when you pay someone back to sync balances."
                  : "No settlements match your search query or group filter."
              }
            />
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--glass-border)] text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] select-none">
                <span className="flex-1">Payer ➔ Receiver</span>
                <span className="w-40 hidden lg:block">Group</span>
                <span className="w-32 text-right hidden sm:block">Date</span>
                <span className="w-36 text-right">Amount</span>
              </div>

              <div className="divide-y divide-[var(--glass-border)]">
                {filteredSettlements.map((s) => {
                  const payerName =
                    s.payer?.username || s.payer?.email?.split("@")[0] || s.payerId.slice(0, 8);
                  const receiverName =
                    s.receiver?.username || s.receiver?.email?.split("@")[0] || s.receiverId.slice(0, 8);

                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.01] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap text-sm font-semibold text-[var(--color-text-primary)]">
                          <span>{payerName}</span>
                          <span className="text-xs text-[var(--color-text-muted)] font-normal">paid</span>
                          <span>{receiverName}</span>
                        </div>
                        {s.note && <p className="text-xs text-[var(--color-text-muted)] mt-1">{s.note}</p>}
                      </div>

                      <div className="w-40 hidden lg:block truncate text-xs font-medium text-[var(--color-text-secondary)]">
                        {s.groupName}
                      </div>

                      <div className="w-32 text-right text-xs text-[var(--color-text-secondary)] hidden sm:block">
                        {new Date(s.settledAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>

                      <div className="w-36 text-right text-sm font-bold text-[var(--color-text-primary)]">
                        {formatMoney(s.originalAmount, s.originalCurrency)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record Modal */}
      {showRecordModal && (
        <RecordSettlementModal
          open={showRecordModal}
          onClose={() => setShowRecordModal(false)}
          onSuccess={handleRefetch}
        />
      )}
    </div>
  );
}
