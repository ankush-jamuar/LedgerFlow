import { PageContainer } from "@/components/ui/PageContainer";

export default function ChatLoading() {
  return (
    <PageContainer>
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-28 rounded-lg bg-white/5" />
        <div className="h-4 w-60 rounded-lg bg-white/5" />
        <div className="mt-6 flex h-[400px] gap-4">
          <div className="glass w-1/3 rounded-xl hidden md:block" />
          <div className="glass flex-1 rounded-xl" />
        </div>
      </div>
    </PageContainer>
  );
}
