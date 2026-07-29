import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-slate-200/70",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/60 bg-white p-5 sm:p-6">
      <Skeleton className="mb-4 h-10 w-10 rounded-xl" />
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="mb-1 h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/60 bg-white p-5 sm:p-6">
      <Skeleton className="mb-2 h-8 w-20" />
      <Skeleton className="mb-1 h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

export function SkeletonPhaseCard() {
  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center gap-3 sm:mb-4">
        <Skeleton className="size-10 rounded-full sm:size-11" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export default Skeleton;
