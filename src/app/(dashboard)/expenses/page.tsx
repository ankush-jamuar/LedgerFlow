import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PageTransition } from "@/components/system/PageTransition";
import { ExpensesClient } from "@/components/expenses/ExpensesClient";

export const metadata: Metadata = { title: "Expenses" };

export default function ExpensesPage() {
  return (
    <PageTransition>
      <PageContainer>
        <DashboardShell>
          <SectionHeader
            title="Expenses"
            subtitle="View and manage all tracked expenses"
          />
          <ExpensesClient />
        </DashboardShell>
      </PageContainer>
    </PageTransition>
  );
}
