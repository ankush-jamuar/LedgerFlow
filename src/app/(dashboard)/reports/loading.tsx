import { PageContainer } from "@/components/ui/PageContainer";

export default function ReportsLoading() {
  return (
    <PageContainer>
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 rounded-lg bg-white/5" />
        <div className="h-4 w-56 rounded-lg bg-white/5" />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 glass h-64 rounded-xl" />
          <div className="glass h-64 rounded-xl" />
        </div>
        <div className="glass h-48 rounded-xl" />
      </div>
    </PageContainer>
  );
}
