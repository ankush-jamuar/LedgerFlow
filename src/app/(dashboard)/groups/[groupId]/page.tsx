import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { PageTransition } from "@/components/system/PageTransition";
import { GroupDetailClient } from "@/components/groups/GroupDetailClient";

interface GroupDetailPageProps {
  params: Promise<{ groupId: string }>;
}

export async function generateMetadata({ params }: GroupDetailPageProps): Promise<Metadata> {
  const { groupId } = await params;
  return {
    title: `Group · ${groupId.slice(0, 8)}`,
  };
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { groupId } = await params;

  return (
    <PageTransition>
      <PageContainer>
        <DashboardShell>
          <GroupDetailClient groupId={groupId} />
        </DashboardShell>
      </PageContainer>
    </PageTransition>
  );
}
