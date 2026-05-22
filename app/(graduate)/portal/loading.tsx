import { SkeletonBlock } from "@/components/shared/skeleton-block";

export default function PortalLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:py-10">
      <div className="mb-8 space-y-2">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-6 w-3/4" />
          <SkeletonBlock className="h-4 w-1/2" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-8 w-20" />
          <SkeletonBlock className="h-2 w-full" />
          <SkeletonBlock className="h-9 w-full" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-8 w-20" />
          <SkeletonBlock className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
}
