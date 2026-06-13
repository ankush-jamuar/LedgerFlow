import { PageContainer } from "@/components/ui/PageContainer";

export default function GroupsLoading() {
  return (
    <PageContainer>
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-36 rounded-lg bg-white/5" />
        <div className="h-4 w-56 rounded-lg bg-white/5" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass h-36 rounded-xl" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
