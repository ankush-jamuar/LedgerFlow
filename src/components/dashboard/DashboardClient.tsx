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
    <div className="space-y-6">
      {/* 6-Up KPI Metric Row */}
      <KpiRow overview={undefined} loading={true} currencyPreference="INR" />

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Trends and analytics */}
        <div className="lg:col-span-2 space-y-6">
          <FinancialChart reports={undefined} loading={true} currencyPreference="INR" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ImportInsights reports={undefined} loading={true} />
            <AnomalyCenter anomalyOverview={undefined} loading={true} />
          </div>
        </div>

        {/* Right Side: Tall Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed activities={[]} loading={true} />
        </div>
      </div>
    </div>
  );
}

function DashboardInner() {
  // Queries
  const {
    data: overview,
    isLoading: isOverviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useDashboardOverview();

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
  } = useDashboardReports();

  const { data: prefData } = useUserPreferences();

  const isError =
    overviewError || activityError || anomaliesError || reportsError;
  const currency = prefData?.preferences?.currency ?? "INR";

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
    <div className="space-y-6">
      {/* 6-Up KPI Metric Row */}
      <KpiRow
        overview={overview}
        loading={isOverviewLoading}
        currencyPreference={currency}
      />

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Trends and analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly line sparkline */}
          <FinancialChart
            reports={reports}
            loading={isReportsLoading}
            currencyPreference={currency}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Import reconciliation stats */}
            <ImportInsights reports={reports} loading={isReportsLoading} />

            {/* Anomaly list and metrics */}
            <AnomalyCenter
              anomalyOverview={anomalies}
              loading={isAnomaliesLoading}
            />
          </div>
        </div>

        {/* Right Side: Tall Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed activities={activities} loading={isActivityLoading} />
        </div>
      </div>
    </div>
  );
}
