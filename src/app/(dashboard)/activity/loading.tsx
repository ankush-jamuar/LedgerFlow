import { PageContainer } from "@/components/ui/PageContainer";

export default function ActivityLoading() {
  return (
    <PageContainer>
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-44 rounded-lg bg-white/5" />
        <div className="h-4 w-72 rounded-lg bg-white/5" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
