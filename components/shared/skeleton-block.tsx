import { cn } from "@/lib/utils";

/**
 * Tiny shimmer block used in loading.tsx files.
 *
 * Keeps shadcn's `Skeleton` for inline use; this is a chunkier one
 * for full-page loading states.
 */
export function SkeletonBlock({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-lg bg-muted/70 dark:bg-muted/40",
        className,
      )}
      {...props}
    />
  );
}
