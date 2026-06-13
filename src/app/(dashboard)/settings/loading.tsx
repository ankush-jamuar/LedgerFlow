import { PageContainer } from "@/components/ui/PageContainer";

export default function SettingsLoading() {
  return (
    <PageContainer>
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 rounded-lg bg-white/5" />
        <div className="h-4 w-64 rounded-lg bg-white/5" />
        <div className="mt-6 max-w-2xl space-y-6">
          <div className="glass h-32 rounded-xl" />
          <div className="glass h-48 rounded-xl" />
        </div>
      </div>
    </PageContainer>
  );
}
