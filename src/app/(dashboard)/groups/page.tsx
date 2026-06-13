import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = { title: "Groups" };

export default function GroupsPage() {
  return (
    <PageContainer>
      <DashboardShell>
        <SectionHeader
          title="Groups"
          subtitle="Manage your shared expense groups"
        />
      </DashboardShell>
    </PageContainer>
  );
}
