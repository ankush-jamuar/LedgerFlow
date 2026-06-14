import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PageTransition } from "@/components/system/PageTransition";
import { ImportClient } from "@/components/imports/ImportClient";

export const metadata: Metadata = { title: "Import Center" };

export default function ImportPage() {
  return (
    <PageTransition>
      <PageContainer>
        <DashboardShell>
          <SectionHeader
            title="Import Center"
            subtitle="Upload and process CSV expense files"
          />
          <Suspense fallback={<div className="h-48 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />}>
            <ImportClient />
          </Suspense>
        </DashboardShell>
      </PageContainer>
    </PageTransition>
  );
}
