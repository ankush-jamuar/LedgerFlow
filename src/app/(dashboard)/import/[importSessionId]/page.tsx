import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { PageTransition } from "@/components/system/PageTransition";
import { ImportReportClient } from "@/components/imports/ImportReportClient";

export const metadata: Metadata = { title: "Import Session Report" };

interface ImportReportPageProps {
  params: Promise<{ importSessionId: string }>;
}

export default async function ImportReportPage({ params }: ImportReportPageProps) {
  const { importSessionId } = await params;
  
  return (
    <PageTransition>
      <PageContainer>
        <DashboardShell>
          <Suspense fallback={<div className="h-48 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />}>
            <ImportReportClient importSessionId={importSessionId} />
          </Suspense>
        </DashboardShell>
      </PageContainer>
    </PageTransition>
  );
}
