import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = { title: "Import Center" };

export default function ImportPage() {
  return (
    <PageContainer>
      <DashboardShell>
        <SectionHeader
          title="Import Center"
          subtitle="Upload and process CSV expense files"
        />
      </DashboardShell>
    </PageContainer>
  );
}
