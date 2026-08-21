import type { ViewMode } from "@/components/projects/ViewToggle";

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[var(--border)] bg-white p-[22px]">
      <div className="h-[16px] w-2/3 animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      <div className="h-[12px] w-1/2 animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      <div className="mt-auto flex items-center justify-between pt-1">
        <div className="h-[26px] w-[70px] animate-pulse rounded-full bg-[var(--panel-3)]" />
        <div className="h-[12px] w-[64px] animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-[var(--border)] px-5 py-[16px] last:border-b-0">
      <div className="h-[13px] flex-[1.6] animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      <div className="h-[13px] flex-[1.1] animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      <div className="h-[13px] flex-1 animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      <div className="h-[13px] flex-[0.7] animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      <div className="h-[13px] flex-[0.9] animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
    </div>
  );
}

export function ProjectsSkeleton({ view }: { view: ViewMode }) {
  if (view === "list") {
    return (
      <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-white">
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
