import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PageTransition } from "@/components/system/PageTransition";
import { SettlementsClient } from "@/components/settlements/SettlementsClient";

export const metadata: Metadata = { title: "Settlements" };

export default function SettlementsPage() {
  return (
    <PageTransition>
      <PageContainer>
        <DashboardShell>
          <SectionHeader
            title="Settlements"
            subtitle="Resolve balances and track payments between members"
          />
          <SettlementsClient />
        </DashboardShell>
      </PageContainer>
    </PageTransition>
  );
}
