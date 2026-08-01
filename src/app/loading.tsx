import { SkeletonStatCard } from "@/components/ui/Skeleton";

function LoadingSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="py-14 sm:py-16 md:py-24">
      <div className="container-page">
        <div className="mb-8 max-w-3xl sm:mb-10 md:mb-14">
          <div className="mb-3 h-3 w-24 animate-pulse rounded-full bg-slate-200 sm:mb-4" />
          <div className="mb-4 h-8 w-5/6 animate-pulse rounded-xl bg-slate-200 sm:h-10" />
          <div className="h-4 w-2/3 animate-pulse rounded-lg bg-slate-200" />
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero skeleton */}
      <section className="relative overflow-hidden bg-mesh-dark">
        <div className="container-page relative grid items-center gap-10 py-14 sm:gap-12 sm:py-16 lg:min-h-[600px] lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-20">
          <div className="min-w-0">
            <div className="mb-6 flex items-center gap-3 sm:mb-7">
              <div className="h-6 w-32 animate-pulse rounded-full bg-white/10" />
              <div className="h-6 w-28 animate-pulse rounded-full bg-white/10" />
            </div>
            <div className="mb-4 h-6 w-40 animate-pulse rounded-lg bg-white/10 sm:mb-5" />
            <div className="mb-2 h-12 w-full animate-pulse rounded-2xl bg-white/10 sm:h-16" />
            <div className="mb-2 h-12 w-4/5 animate-pulse rounded-2xl bg-white/10 sm:h-16" />
            <div className="mt-5 h-5 w-96 max-w-full animate-pulse rounded-lg bg-white/10" />
            <div className="mt-8 flex gap-3">
              <div className="h-12 w-36 animate-pulse rounded-xl bg-white/15" />
              <div className="h-12 w-36 animate-pulse rounded-xl bg-white/10" />
            </div>
          </div>
          <div className="hidden min-w-0 lg:block">
            <div className="aspect-[4/3] w-full animate-pulse rounded-[1.5rem] bg-white/10" />
          </div>
        </div>
      </section>

      <LoadingSection>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      </LoadingSection>
    </div>
  );
}
