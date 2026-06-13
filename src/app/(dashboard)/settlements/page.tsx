import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = { title: "Settlements" };

export default function SettlementsPage() {
  return (
    <PageContainer>
      <DashboardShell>
        <SectionHeader
          title="Settlements"
          subtitle="Resolve balances and track payments between members"
        />
      </DashboardShell>
    </PageContainer>
  );
}
