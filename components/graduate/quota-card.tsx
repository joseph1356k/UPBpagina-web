"use client";

import { Users2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { pluralize } from "@/lib/format";
import { useGraduatePortal } from "./auth-provider";

interface QuotaCardProps {
  className?: string;
  /** When `compact`, hides the descriptive paragraph (used in dashboard previews). */
  compact?: boolean;
}

export function QuotaCard({ className, compact = false }: QuotaCardProps) {
  const { quotaUsed, quotaTotal, quotaAvailable, isFull } = useGraduatePortal();
  const pct = quotaTotal === 0 ? 0 : Math.min(100, (quotaUsed / quotaTotal) * 100);
  const nearFull = pct >= 75 && !isFull;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Users2 className="size-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium leading-snug text-foreground">
              Cupo de invitados
            </h3>
            {!compact && (
              <p className="text-xs text-muted-foreground">
                Tope asignado por la organización para este evento.
              </p>
            )}
          </div>
        </div>

        <p className="tabular-nums font-serif text-lg font-semibold text-foreground">
          <span
            className={cn(
              isFull && "text-warning",
              nearFull && "text-warning",
            )}
          >
            {quotaUsed}
          </span>
          <span className="text-muted-foreground"> / {quotaTotal}</span>
        </p>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={quotaTotal}
        aria-valuenow={quotaUsed}
        aria-label="Cupos de invitados usados"
      >
        <div
          className={cn(
            "h-full transition-all duration-300",
            isFull || nearFull ? "bg-warning" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {!compact && (
        <p className="mt-3 text-sm text-muted-foreground">
          {isFull
            ? "Has alcanzado el máximo de invitados permitidos."
            : `Te ${quotaAvailable === 1 ? "queda" : "quedan"} ${pluralize(
                quotaAvailable,
                "cupo",
                "cupos",
              )} disponible${quotaAvailable === 1 ? "" : "s"}.`}
        </p>
      )}
    </div>
  );
}
