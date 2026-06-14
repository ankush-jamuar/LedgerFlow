import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { PageTransition } from "@/components/system/PageTransition";
import { ExpenseDetailClient } from "@/components/expenses/ExpenseDetailClient";

interface ExpenseDetailPageProps {
  params: Promise<{ expenseId: string }>;
}

export async function generateMetadata({ params }: ExpenseDetailPageProps): Promise<Metadata> {
  const { expenseId } = await params;
  return {
    title: `Expense · ${expenseId.slice(0, 8)}`,
  };
}

export default async function ExpenseDetailPage({ params }: ExpenseDetailPageProps) {
  const { expenseId } = await params;

  return (
    <PageTransition>
      <PageContainer>
        <DashboardShell>
          <ExpenseDetailClient expenseId={expenseId} />
        </DashboardShell>
      </PageContainer>
    </PageTransition>
  );
}
