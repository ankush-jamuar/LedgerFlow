/**
 * src/components/dashboard/DashboardClient.tsx — Dashboard Client Shell
 *
 * Client entrypoint for the dashboard.
 * Shows skeleton loaders during initial Clerk auth loading,
 * then renders the full dashboard with live data.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  useDashboardOverview,
  useDashboardActivity,
  useDashboardAnomalies,
  useDashboardReports,
} from "@/lib/hooks/use-dashboard";
import { useUserPreferences } from "@/lib/hooks/use-preferences";
import { KpiRow } from "@/components/dashboard/KpiRow";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { AnomalyCenter } from "@/components/dashboard/AnomalyCenter";
import { ImportInsights } from "@/components/dashboard/ImportInsights";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ErrorState } from "@/components/ui/ErrorState";

export function DashboardClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const { isLoaded, isSignedIn } = useAuth();

  // Render skeletons immediately during SSR and initial Clerk loading
  if (!mounted || !isLoaded || !isSignedIn) {
    return <DashboardSkeleton />;
  }

  return <DashboardInner />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <KpiRow overview={undefined} loading={true} currencyPreference="INR" />

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: chart + insights */}
        <div className="xl:col-span-2 space-y-6">
          <FinancialChart reports={undefined} loading={true} currencyPreference="INR" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ImportInsights reports={undefined} loading={true} />
            <AnomalyCenter anomalyOverview={undefined} loading={true} />
          </div>
        </div>

        {/* Right: activity feed */}
        <div className="xl:col-span-1">
          <ActivityFeed activities={[]} loading={true} />
        </div>
      </div>
    </div>
  );
}

function DashboardInner() {
  const { data: prefData } = useUserPreferences();
  const currency = prefData?.preferences?.currency ?? "INR";

  // Queries
  const {
    data: overview,
    isLoading: isOverviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useDashboardOverview(currency);

  const {
    data: activityData,
    isLoading: isActivityLoading,
    error: activityError,
    refetch: refetchActivity,
  } = useDashboardActivity(20);

  const {
    data: anomalies,
    isLoading: isAnomaliesLoading,
    error: anomaliesError,
    refetch: refetchAnomalies,
  } = useDashboardAnomalies();

  const {
    data: reports,
    isLoading: isReportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useDashboardReports(currency);


  const isError =
    overviewError || activityError || anomaliesError || reportsError;

  const handleRetry = () => {
    refetchOverview();
    refetchActivity();
    refetchAnomalies();
    refetchReports();
  };



  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load dashboard data"
          message="We encountered an issue loading your workspace metrics. Please try again."
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const activities = activityData?.activities ?? [];

  return (
    <div className="space-y-8">
      {/* KPI Metric Row — 6-up grid */}
      <section aria-label="Key performance indicators">
        <KpiRow
          overview={overview}
          loading={isOverviewLoading}
          currencyPreference={currency}
        />
      </section>

      {/* Main Grid: chart + cards + activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left: Financial trends + import/anomaly cards */}
        <div className="xl:col-span-2 space-y-6">
          {/* Financial Health sparkline */}
          <FinancialChart
            reports={reports}
            loading={isReportsLoading}
            currencyPreference={currency}
          />

          {/* Import + Anomaly panel row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ImportInsights reports={reports} loading={isReportsLoading} />
            <AnomalyCenter
              anomalyOverview={anomalies}
              loading={isAnomaliesLoading}
            />
          </div>
        </div>

        {/* Right: Activity Feed — full height */}
        <div className="xl:col-span-1 xl:sticky xl:top-6">
          <ActivityFeed activities={activities} loading={isActivityLoading} />
        </div>
      </div>
    </div>
  );
}
