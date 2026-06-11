"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { BrandMark } from "@/components/shared/brand-mark";
import { UpbShield } from "@/components/shared/upb-shield";
import { Button } from "@/components/ui/button";

interface RedirectNoticeProps {
  /** Absolute URL to the official UPB portal. */
  destination: string;
  /** Seconds before the automatic redirect fires. */
  seconds: number;
}

export function RedirectNotice({ destination, seconds }: RedirectNoticeProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [cancelled, setCancelled] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (cancelledRef.current) return;

    const tick = setInterval(() => {
      setRemaining((n) => Math.max(0, n - 1));
    }, 1000);

    const go = setTimeout(() => {
      if (!cancelledRef.current) {
        window.location.href = destination;
      }
    }, seconds * 1000);

    return () => {
      clearInterval(tick);
      clearTimeout(go);
    };
  }, [destination, seconds]);

  function cancel() {
    cancelledRef.current = true;
    setCancelled(true);
  }

  // Circular progress: fraction elapsed
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const progress = cancelled ? 0 : (seconds - remaining) / seconds;
  const offset = circumference * (1 - progress);

  return (
    <div className="upb-warm-bg relative flex min-h-screen flex-1 flex-col items-center justify-center px-4 py-12">
      <div
        aria-hidden
        className="grid-bg pointer-events-none absolute inset-0 opacity-25"
      />
      {/* Gold ribbon */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent opacity-70"
      />

      {/* Home brand link */}
      <div className="absolute left-4 top-5 md:left-8">
        <BrandMark size="sm" />
      </div>

      <div className="animate-in-up relative w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex justify-center">
          <UpbShield className="size-16 drop-shadow-sm" />
        </div>

        <h1 className="text-balance font-serif text-2xl font-semibold tracking-tight md:text-3xl">
          Estás saliendo de UPB Ceremonias
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
          Serás dirigido al portal oficial de la Universidad Pontificia
          Bolivariana.
        </p>

        {/* Countdown ring */}
        {!cancelled ? (
          <div className="mx-auto mt-8 flex flex-col items-center gap-3">
            <div className="relative size-24">
              <svg
                viewBox="0 0 80 80"
                className="size-full -rotate-90"
                aria-hidden
              >
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="4"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-serif text-3xl font-semibold tabular-nums">
                {remaining}
              </span>
            </div>
            <p
              className="text-xs text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {remaining > 0
                ? `Redirigiendo en ${remaining} segundo${remaining !== 1 ? "s" : ""}…`
                : "Redirigiendo…"}
            </p>
          </div>
        ) : (
          <p className="mx-auto mt-8 max-w-sm rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Redirección automática cancelada. Puedes continuar cuando quieras.
          </p>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto">
            {/* External institutional link — opens in the same tab on purpose */}
            <a href={destination} rel="noopener">
              Ir al portal oficial UPB
              <ExternalLink className="size-4" />
            </a>
          </Button>

          {!cancelled && (
            <button
              type="button"
              onClick={cancel}
              className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Cancelar redirección automática
            </button>
          )}

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Volver a UPB Ceremonias
          </Link>
        </div>

        {/* Destination shown plainly */}
        <p className="mt-8 break-all text-[0.7rem] text-muted-foreground/70">
          Destino: {destination}
        </p>
      </div>
    </div>
  );
}
