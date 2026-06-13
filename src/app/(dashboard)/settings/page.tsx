import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PageContainer>
      <DashboardShell>
        <SectionHeader
          title="Settings"
          subtitle="Configure preferences and account information"
        />
      </DashboardShell>
    </PageContainer>
  );
}
