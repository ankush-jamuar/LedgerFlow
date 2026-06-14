import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageTransition } from "@/components/system/PageTransition";

export const metadata: Metadata = { title: "Chat" };

export default function ChatPage() {
  return (
    <PageTransition>
      <PageContainer>
        <DashboardShell>
          <SectionHeader
            title="Chat"
            subtitle="Realtime communication feed with group members"
          />
          <EmptyState
            icon={MessageSquare}
            title="Chat is coming soon"
            description="Realtime group messaging will be available in an upcoming release. Stay tuned."
          />
        </DashboardShell>
      </PageContainer>
    </PageTransition>
  );
}
