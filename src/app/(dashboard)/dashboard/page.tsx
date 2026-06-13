import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <PageContainer>
      <DashboardShell>
        <SectionHeader
          title="Dashboard"
          subtitle="Your financial overview at a glance"
        />
      </DashboardShell>
    </PageContainer>
  );
}
