import { PageContainer } from "@/components/ui/PageContainer";

export default function ExpenseDetailLoading() {
  return (
    <PageContainer>
      <div className="animate-pulse space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 rounded-lg bg-white/5" />
            <div className="h-4 w-72 rounded-lg bg-white/5 mt-2" />
          </div>
          <div className="h-10 w-24 rounded-lg bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="glass h-48 rounded-xl" />
            <div className="glass h-64 rounded-xl" />
          </div>
          <div className="space-y-6">
            <div className="glass h-40 rounded-xl" />
            <div className="glass h-40 rounded-xl" />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
