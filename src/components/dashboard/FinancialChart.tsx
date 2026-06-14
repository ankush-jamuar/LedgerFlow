/**
 * src/components/dashboard/FinancialChart.tsx — Monthly Spending & Settlement SVG Sparkline
 *
 * Implements a pure React SVG line chart visualizing financial trends.
 * Zero-dependency, lightweight, fully responsive, and immune to hydration mismatches.
 */

"use client";

import { useMemo, useState } from "react";
import { LineChart, ArrowUpRight } from "lucide-react";
import { formatMoney } from "@/lib/utils/format-money";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { DashboardReports } from "@/lib/dashboard/types";

interface FinancialChartProps {
  reports?: DashboardReports;
  loading?: boolean;
  currencyPreference?: string;
}

export function FinancialChart({
  reports,
  loading = false,
  currencyPreference = "INR",
}: FinancialChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (!reports) return [];

    const { monthlySpending = [], monthlySettlements = [] } = reports;

    // Collate all unique months from both datasets
    const allMonths = Array.from(
      new Set([
        ...monthlySpending.map((item) => item.month),
        ...monthlySettlements.map((item) => item.month),
      ])
    ).sort();

    return allMonths.map((m) => {
      const spend = monthlySpending.find((item) => item.month === m)?.amount ?? 0;
      const settle = monthlySettlements.find((item) => item.month === m)?.amount ?? 0;
      return {
        month: m,
        spend,
        settle,
      };
    });
  }, [reports]);

  if (loading || !reports) {
    return <SkeletonCard />;
  }

  if (chartData.length === 0) {
    return (
      <div className="glass rounded-xl p-5 h-[320px]">
        <div className="flex items-center gap-2 border-b border-[var(--glass-border)] pb-3 mb-4">
          <LineChart className="h-4.5 w-4.5 text-[var(--color-primary-light)]" />
          <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
            Financial Trends
          </h3>
        </div>
        <EmptyState
          icon={LineChart}
          title="No transaction history"
          description="Record expenses or settlements in your groups to populate trend charts."
        />
      </div>
    );
  }

  // Find max value for scaling the Y axis
  const maxVal = Math.max(
    ...chartData.map((d) => Math.max(d.spend, d.settle)),
    100 // Safe default minimum height scale
  );

  // SVG dimensions
  const width = 500;
  const height = 180;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute point coordinates
  const points = chartData.map((d, index) => {
    const x =
      paddingLeft +
      (chartData.length > 1
        ? (index / (chartData.length - 1)) * chartWidth
        : chartWidth / 2);
    // Invert Y coordinate since SVG (0,0) starts at top-left
    const ySpend =
      paddingTop + chartHeight - (d.spend / maxVal) * chartHeight;
    const ySettle =
      paddingTop + chartHeight - (d.settle / maxVal) * chartHeight;
    return { x, ySpend, ySettle, data: d };
  });

  // Build SVG path strings
  const getLinePath = (coords: Array<{ x: number; y: number }>) => {
    if (coords.length === 0) return "";
    return coords.reduce(
      (path, pt, idx) =>
        idx === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`,
      ""
    );
  };

  const getAreaPath = (
    coords: Array<{ x: number; y: number }>,
    baseY: number
  ) => {
    if (coords.length === 0) return "";
    const linePath = getLinePath(coords);
    return `${linePath} L ${coords[coords.length - 1]!.x} ${baseY} L ${coords[0]!.x} ${baseY} Z`;
  };

  const spendCoords = points.map((p) => ({ x: p.x, y: p.ySpend }));
  const settleCoords = points.map((p) => ({ x: p.x, y: p.ySettle }));

  const spendPath = getLinePath(spendCoords);
  const settlePath = getLinePath(settleCoords);

  const spendArea = getAreaPath(spendCoords, paddingTop + chartHeight);
  const settleArea = getAreaPath(settleCoords, paddingTop + chartHeight);

  // Friendly month labels (e.g. "2026-06" -> "Jun 26")
  const formatMonthLabel = (m: string) => {
    const [year, month] = m.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "2-digit",
    }).format(date);
  };

  // Hover point info
  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="glass rounded-xl p-5 flex flex-col h-full">
      {/* Title & Legend */}
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <LineChart className="h-4.5 w-4.5 text-[var(--color-primary-light)]" />
          <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
            Financial Health
          </h3>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-secondary)] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-[#818cf8]" />
            <span>Spending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-[#2dd4bf]" />
            <span>Settlements</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        {/* Sparkline Canvas */}
        <div className="relative w-full flex-grow mt-1 select-none">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible"
          >
            {/* Gradients */}
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="settleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {Array.from({ length: 4 }).map((_, i) => {
              const yVal = paddingTop + (i * chartHeight) / 3;
              const labelVal = maxVal - (i * maxVal) / 3;
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={yVal}
                    x2={width - paddingRight}
                    y2={yVal}
                    stroke="var(--glass-border)"
                    strokeWidth="0.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={yVal + 3}
                    textAnchor="end"
                    className="fill-[var(--color-text-muted)] text-[9px] font-mono"
                  >
                    {formatMoney(labelVal, currencyPreference)
                      .replace(/[\u20B9$,]/g, "") // Remove symbols for grid cleanliness
                      .split(".")[0]}
                  </text>
                </g>
              );
            })}

            {/* Fill Under Lines */}
            <path d={spendArea} fill="url(#spendGrad)" />
            <path d={settleArea} fill="url(#settleGrad)" />

            {/* Trend Lines */}
            <path
              d={spendPath}
              fill="none"
              stroke="#818cf8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={settlePath}
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* X Axis month labels */}
            {chartData.map((d, index) => {
              const pt = points[index]!;
              // Skip labels to prevent overlap if too many data points
              const shouldShow =
                chartData.length <= 6 ||
                index === 0 ||
                index === chartData.length - 1 ||
                index === Math.floor(chartData.length / 2);

              return (
                <g key={d.month}>
                  {shouldShow && (
                    <text
                      x={pt.x}
                      y={height - 5}
                      textAnchor="middle"
                      className="fill-[var(--color-text-muted)] text-[9px]"
                    >
                      {formatMonthLabel(d.month)}
                    </text>
                  )}
                  {/* Invisible interactive hover zone columns */}
                  <rect
                    x={pt.x - chartWidth / (chartData.length * 2)}
                    y={paddingTop}
                    width={chartWidth / Math.max(chartData.length - 1, 1)}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(index)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                </g>
              );
            })}

            {/* Active hover indicators */}
            {hoveredPoint && (
              <g>
                {/* Vertical slider line */}
                <line
                  x1={hoveredPoint.x}
                  y1={paddingTop}
                  x2={hoveredPoint.x}
                  y2={paddingTop + chartHeight}
                  stroke="var(--glass-border-hover)"
                  strokeWidth="1"
                />
                
                {/* Spend dot */}
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.ySpend}
                  r="4.5"
                  fill="#818cf8"
                  stroke="var(--color-brand-surface)"
                  strokeWidth="1.5"
                />
                
                {/* Settle dot */}
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.ySettle}
                  r="4.5"
                  fill="#2dd4bf"
                  stroke="var(--color-brand-surface)"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </svg>
        </div>

        {/* Hover values or default summary strip */}
        <div className="mt-2.5 min-h-[48px] bg-white/[0.01] border border-[var(--glass-border)] rounded-lg p-2.5 flex items-center justify-between flex-shrink-0 text-xs">
          {hoveredPoint ? (
            <>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                  {formatMonthLabel(hoveredPoint.data.month)}
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <span className="text-[9px] text-[var(--color-text-muted)] block">Spending</span>
                  <span className="font-bold text-[#818cf8]">
                    {formatMoney(hoveredPoint.data.spend, currencyPreference)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-[var(--color-text-muted)] block">Settled</span>
                  <span className="font-bold text-[#2dd4bf]">
                    {formatMoney(hoveredPoint.data.settle, currencyPreference)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                  Trend Summary
                </p>
                <p className="text-[10px] text-[var(--color-text-secondary)]">
                  Hover details above
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowUpRight className="h-4 w-4 text-[var(--color-success)]" />
                <span className="font-bold text-[var(--color-text-primary)]">
                  {chartData.length} active months
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
