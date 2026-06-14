import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PageTransition } from "@/components/system/PageTransition";
import { GroupsClient } from "@/components/groups/GroupsClient";

export const metadata: Metadata = { title: "Groups" };

export default function GroupsPage() {
  return (
    <PageTransition>
      <PageContainer>
        <DashboardShell>
          <SectionHeader
            title="Groups"
            subtitle="Manage your shared expense groups"
          />
          <GroupsClient />
        </DashboardShell>
      </PageContainer>
    </PageTransition>
  );
}
