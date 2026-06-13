import { PageContainer } from "@/components/ui/PageContainer";

export default function SettlementsLoading() {
  return (
    <PageContainer>
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded-lg bg-white/5" />
        <div className="h-4 w-80 rounded-lg bg-white/5" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
