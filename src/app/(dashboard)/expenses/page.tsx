import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = { title: "Expenses" };

export default function ExpensesPage() {
  return (
    <PageContainer>
      <DashboardShell>
        <SectionHeader
          title="Expenses"
          subtitle="View and manage all tracked expenses"
        />
      </DashboardShell>
    </PageContainer>
  );
}
