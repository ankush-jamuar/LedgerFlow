import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PageTransition } from "@/components/system/PageTransition";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <PageTransition>
      <PageContainer>
        <DashboardShell>
          <SectionHeader
            title="Reports"
            subtitle="Spending analysis and financial summaries"
          />
        </DashboardShell>
      </PageContainer>
    </PageTransition>
  );
}
