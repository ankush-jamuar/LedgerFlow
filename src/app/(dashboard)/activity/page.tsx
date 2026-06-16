"use client";

import { useDashboardActivity } from "@/lib/hooks/use-dashboard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PageTransition } from "@/components/system/PageTransition";

export default function ActivityPage() {
  const { data, isLoading } = useDashboardActivity(50);
  const activities = data?.activities ?? [];

  return (
    <PageTransition>
      <PageContainer>
        <DashboardShell>
          <SectionHeader
            title="Activity Feed"
            subtitle="Audit logs and realtime update feed of expense activities"
          />
          <div className="max-w-4xl mx-auto">
            <ActivityFeed activities={activities} loading={isLoading} />
          </div>
        </DashboardShell>
      </PageContainer>
    </PageTransition>
  );
}
