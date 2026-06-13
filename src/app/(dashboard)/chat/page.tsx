import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = { title: "Chat" };

export default function ChatPage() {
  return (
    <PageContainer>
      <DashboardShell>
        <SectionHeader
          title="Chat"
          subtitle="Realtime communication feed with group members"
        />
      </DashboardShell>
    </PageContainer>
  );
}
