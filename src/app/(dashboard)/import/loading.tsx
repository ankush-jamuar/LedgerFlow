import { PageContainer } from "@/components/ui/PageContainer";

export default function ImportLoading() {
  return (
    <PageContainer>
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-44 rounded-lg bg-white/5" />
        <div className="h-4 w-60 rounded-lg bg-white/5" />
        <div className="mt-6 glass h-40 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass h-48 rounded-xl" />
          <div className="glass h-48 rounded-xl" />
        </div>
      </div>
    </PageContainer>
  );
}
