import { cn } from "@/lib/utils";

/**
 * Accessible labeled horizontal bars. The values are real text (read by screen
 * readers); the bar itself is decorative (`aria-hidden`). No chart dependency.
 */

type Tone = "primary" | "success" | "info" | "warning" | "destructive";

const BAR_TONE: Record<Tone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

export interface BarItem {
  label: string;
  value: number;
  tone?: Tone;
  hint?: string;
}

export function BarList({
  items,
  max,
  formatValue = (n) => String(n),
  className,
}: {
  items: BarItem[];
  /** Scale ceiling; defaults to the largest value. */
  max?: number;
  formatValue?: (n: number) => string;
  className?: string;
}) {
  const top = Math.max(max ?? 0, ...items.map((i) => i.value), 1);
  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {items.map((it) => {
        const pct = Math.min(100, Math.max(0, (it.value / top) * 100));
        return (
          <li key={it.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-foreground/90">{it.label}</span>
              <span className="font-serif font-semibold tabular-nums text-foreground">
                {formatValue(it.value)}
              </span>
            </div>
            <div
              aria-hidden
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  BAR_TONE[it.tone ?? "primary"],
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            {it.hint ? (
              <span className="text-xs text-muted-foreground">{it.hint}</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
