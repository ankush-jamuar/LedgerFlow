import { PageContainer } from "@/components/ui/PageContainer";

/**
 * Dashboard page loading skeleton.
 * Displayed instantly while the dashboard page streams in.
 */
export default function DashboardLoading() {
  return (
    <PageContainer>
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded-lg bg-white/5" />
        <div className="h-4 w-72 rounded-lg bg-white/5" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass h-28 rounded-xl" />
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="glass h-64 rounded-xl" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
