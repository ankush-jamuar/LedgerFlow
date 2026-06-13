import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = { title: "Activity Feed" };

export default function ActivityPage() {
  return (
    <PageContainer>
      <DashboardShell>
        <SectionHeader
          title="Activity Feed"
          subtitle="Audit logs and realtime update feed of expense activities"
        />
      </DashboardShell>
    </PageContainer>
  );
}
