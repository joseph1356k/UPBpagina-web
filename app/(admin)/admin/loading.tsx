import { SkeletonBlock } from "@/components/shared/skeleton-block";

/**
 * Admin loading skeleton — shown while RSC data fetches resolve.
 *
 * Mimics the rough layout of the dashboard so the swap is barely
 * perceptible. Should render in <50ms (static HTML).
 */
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <header className="flex flex-col gap-2 pb-6 border-b border-border">
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="h-8 w-72" />
        <SkeletonBlock className="h-4 w-96 max-w-full" />
      </header>

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <SkeletonBlock className="h-3 w-20 mb-3" />
            <SkeletonBlock className="h-8 w-16 mb-2" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Content row */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-3/4" />
          <div className="grid grid-cols-2 gap-4 pt-4">
            <SkeletonBlock className="h-12" />
            <SkeletonBlock className="h-12" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
          <SkeletonBlock className="h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <SkeletonBlock className="size-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
