import { PageContainer } from "@/components/ui/PageContainer";

export default function ExpensesLoading() {
  return (
    <PageContainer>
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-36 rounded-lg bg-white/5" />
        <div className="h-4 w-64 rounded-lg bg-white/5" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass h-14 rounded-xl" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
