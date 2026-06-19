import { cn } from "@/lib/utils";

/**
 * A single-value progress ring (SVG). `role="img"` + `aria-label` give the
 * full figure to screen readers; the center text is the visible value.
 */

type Tone = "primary" | "success" | "info" | "warning";

const STROKE_TONE: Record<Tone, string> = {
  primary: "stroke-primary",
  success: "stroke-success",
  info: "stroke-info",
  warning: "stroke-warning",
};

export function DonutStat({
  value,
  total,
  label,
  sublabel,
  tone = "success",
  size = 120,
}: {
  value: number;
  /** null = no cap (shows the raw value, full ring muted). */
  total: number | null;
  label?: string;
  sublabel?: string;
  tone?: Tone;
  size?: number;
}) {
  const pct =
    total && total > 0 ? Math.min(100, Math.round((value / total) * 100)) : null;
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const dash = pct != null ? (pct / 100) * circumference : 0;
  const ariaValue =
    total != null
      ? `${value} de ${total}${pct != null ? ` (${pct}%)` : ""}`
      : `${value}`;

  return (
    <div
      role="img"
      aria-label={`${label ? `${label}: ` : ""}${ariaValue}`}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          className="fill-none stroke-muted"
          strokeWidth="10"
        />
        {pct != null && (
          <circle
            cx="50"
            cy="50"
            r={r}
            className={cn("fill-none transition-all", STROKE_TONE[tone])}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-serif text-xl font-semibold tabular-nums text-foreground">
          {pct != null ? `${pct}%` : value}
        </span>
        {sublabel ? (
          <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
