import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PageTransition } from "@/components/system/PageTransition";

export const metadata: Metadata = { title: "Activity Feed" };

export default function ActivityPage() {
  return (
    <PageTransition>
      <PageContainer>
        <DashboardShell>
          <SectionHeader
            title="Activity Feed"
            subtitle="Audit logs and realtime update feed of expense activities"
          />
        </DashboardShell>
      </PageContainer>
    </PageTransition>
  );
}
