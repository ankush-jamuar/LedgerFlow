import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PageTransition } from "@/components/system/PageTransition";
import { ChatClient } from "@/components/chat/ChatClient";

export const metadata: Metadata = { title: "Chat" };

export default function ChatPage() {
  return (
    <PageTransition>
      <PageContainer>
        <DashboardShell>
          <SectionHeader
            title="Chat Room"
            subtitle="Realtime communication feed with group members"
          />
          <Suspense fallback={<div className="h-96 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />}>
            <ChatClient />
          </Suspense>
        </DashboardShell>
      </PageContainer>
    </PageTransition>
  );
}

