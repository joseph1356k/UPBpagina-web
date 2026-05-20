import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TrendInfo {
  /** e.g. "+12%", "−3" */
  label: string;
  direction: "up" | "down" | "flat";
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: TrendInfo;
  icon?: LucideIcon;
  accent?: "primary" | "success" | "warning" | "info" | "neutral";
  loading?: boolean;
  className?: string;
}

const ACCENT_STYLES = {
  primary: "text-primary bg-primary/10 ring-primary/15",
  success: "text-success bg-success/10 ring-success/15",
  warning: "text-warning bg-warning/10 ring-warning/20",
  info: "text-info bg-info/10 ring-info/15",
  neutral: "text-muted-foreground bg-muted ring-border/40",
} as const;

const TREND_STYLES: Record<TrendInfo["direction"], string> = {
  up: "text-success",
  down: "text-destructive",
  flat: "text-muted-foreground",
};

export function StatCard({
  label,
  value,
  hint,
  trend,
  icon: Icon,
  accent = "neutral",
  loading,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative gap-3 py-5 px-5 ring-foreground/8 transition-shadow hover:ring-foreground/12",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.78rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <span
            aria-hidden
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
              ACCENT_STYLES[accent],
            )}
          >
            <Icon className="size-[18px]" />
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-2">
        {loading ? (
          <span className="inline-block h-8 w-20 animate-pulse rounded-md bg-muted" />
        ) : (
          <span className="font-serif text-[2rem] leading-none font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </span>
        )}
        {trend ? (
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              TREND_STYLES[trend.direction],
            )}
          >
            {trend.label}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </Card>
  );
}
