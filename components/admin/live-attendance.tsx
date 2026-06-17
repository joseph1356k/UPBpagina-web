"use client";

/**
 * Live attendance board.
 *
 * Renders an initial snapshot (CeremonyStats from the server) and then keeps
 * the check-in / denial counters live via a Supabase Realtime subscription to
 * `scan_events`, filtered by the event's `ceremony_id`.
 *
 * In mock mode (`NEXT_PUBLIC_USE_SUPABASE` off) there is no Realtime backend,
 * so the board shows the static snapshot and flags itself as offline — no
 * fake increments.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Users,
  XCircle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { SCAN_DENIED_REASON_LABEL } from "@/lib/constants";
import { formatNumber, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { USE_SUPABASE } from "@/lib/supabase/env";
import type { ScanDeniedReasonDb, ScanResultDb } from "@/lib/supabase/types";
import type { CeremonyStats } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecentScan {
  id: string;
  result: ScanResultDb;
  reason: ScanDeniedReasonDb | null;
  at: string;
}

interface Props {
  ceremonyId: string;
  ceremonyName: string;
  initial: CeremonyStats;
  variant?: "full" | "compact";
}

export function LiveAttendance({
  ceremonyId,
  initial,
  variant = "full",
}: Props) {
  const [checkedIn, setCheckedIn] = useState(initial.guestsCheckedIn);
  const [denied, setDenied] = useState(0);
  const [recent, setRecent] = useState<RecentScan[]>([]);
  const [live, setLive] = useState(false);

  const capacity = initial.capacity;
  const pct =
    capacity && capacity > 0
      ? Math.min(100, Math.round((checkedIn / capacity) * 100))
      : null;
  const near = pct != null && pct >= 90;

  /* ── Realtime subscription ───────────────────────────────────────── */
  useEffect(() => {
    if (!USE_SUPABASE) return;
    const supabase = createClient();

    // Authorize the realtime socket so RLS (staff-only scan_events) lets the
    // rows through. Fire-and-forget; the channel join below picks it up.
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) {
        supabase.realtime.setAuth(data.session.access_token);
      }
    });

    const channel = supabase
      .channel(`scan-events-${ceremonyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "scan_events",
          filter: `ceremony_id=eq.${ceremonyId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            result: ScanResultDb;
            reason: ScanDeniedReasonDb | null;
            scanned_at: string;
          };
          if (row.result === "allowed") setCheckedIn((n) => n + 1);
          else if (row.result === "denied") setDenied((n) => n + 1);
          setRecent((prev) =>
            [
              { id: row.id, result: row.result, reason: row.reason, at: row.scanned_at },
              ...prev,
            ].slice(0, 12),
          );
        },
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ceremonyId]);

  if (variant === "compact") {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success ring-1 ring-success/15">
            <Users className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <p className="font-serif text-2xl font-semibold tabular-nums text-foreground">
                {formatNumber(checkedIn)}
              </p>
              {capacity != null && (
                <p className="text-sm text-muted-foreground tabular-nums">
                  / {formatNumber(capacity)}
                </p>
              )}
              <LiveDot live={live} className="ml-auto" />
            </div>
            <p className="text-xs text-muted-foreground">
              {pct != null ? `${pct}% del aforo` : "Ingresos confirmados"}
            </p>
            {capacity != null && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    near ? "bg-warning" : "bg-success",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return <FullBoard
    checkedIn={checkedIn}
    denied={denied}
    capacity={capacity}
    pct={pct}
    near={near}
    live={live}
    invited={initial.guestsInvited}
    recent={recent}
  />;
}

/* ------------------------------------------------------------------ */
/*  Full board                                                         */
/* ------------------------------------------------------------------ */

function FullBoard({
  checkedIn,
  denied,
  capacity,
  pct,
  near,
  live,
  invited,
  recent,
}: {
  checkedIn: number;
  denied: number;
  capacity: number | null;
  pct: number | null;
  near: boolean;
  live: boolean;
  invited: number;
  recent: RecentScan[];
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);

  return (
    <div
      ref={rootRef}
      className="flex flex-col gap-5 rounded-2xl bg-background p-1 data-[fs=true]:p-6"
      data-fs={isFs}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LiveDot live={live} />
          <span className="text-sm font-medium text-muted-foreground">
            {live ? "En vivo" : USE_SUPABASE ? "Conectando…" : "Sin conexión en vivo (modo demo)"}
          </span>
        </div>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {isFs ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          {isFs ? "Salir" : "Pantalla completa"}
        </button>
      </div>

      {/* Hero counter */}
      <Card className={cn(near && "border-warning/40")}>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Ingresos confirmados
          </p>
          <p className="font-serif text-6xl font-semibold tabular-nums text-foreground md:text-7xl">
            {formatNumber(checkedIn)}
            {capacity != null && (
              <span className="text-3xl font-normal text-muted-foreground md:text-4xl">
                {" "}
                / {formatNumber(capacity)}
              </span>
            )}
          </p>
          {pct != null ? (
            <div className="w-full max-w-md space-y-2">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    near ? "bg-warning" : "bg-success",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p
                className={cn(
                  "text-sm font-medium tabular-nums",
                  near ? "text-warning" : "text-muted-foreground",
                )}
              >
                {pct}% del aforo {near && "· cerca del límite"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Evento sin límite de aforo</p>
          )}
        </CardContent>
      </Card>

      {/* Secondary counters */}
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat
          icon={CheckCircle2}
          tone="success"
          label="Permitidos (en vivo)"
          value={checkedIn}
        />
        <MiniStat
          icon={XCircle}
          tone="danger"
          label="Rechazos (en vivo)"
          value={denied}
        />
        <MiniStat
          icon={Users}
          tone="info"
          label="Invitaciones emitidas"
          value={invited}
        />
      </div>

      {/* Recent feed */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Activity className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Últimos escaneos</p>
          </div>
          {recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {USE_SUPABASE
                ? "Esperando escaneos…"
                : "El feed en vivo requiere Supabase."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((s) => {
                const allowed = s.result === "allowed";
                return (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm"
                  >
                    {allowed ? (
                      <CheckCircle2 className="size-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="size-4 shrink-0 text-destructive" />
                    )}
                    <span className="font-medium text-foreground">
                      {allowed ? "Ingreso permitido" : "Ingreso denegado"}
                    </span>
                    {s.reason && (
                      <span className="truncate text-xs text-muted-foreground">
                        {SCAN_DENIED_REASON_LABEL[s.reason]}
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatTime(s.at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pieces                                                             */
/* ------------------------------------------------------------------ */

function LiveDot({ live, className }: { live: boolean; className?: string }) {
  return (
    <span className={cn("relative flex size-2.5", className)} aria-hidden>
      {live && (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/70" />
      )}
      <span
        className={cn(
          "relative inline-flex size-2.5 rounded-full",
          live ? "bg-success" : "bg-muted-foreground/40",
        )}
      />
    </span>
  );
}

function MiniStat({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof Users;
  tone: "success" | "danger" | "info";
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1",
            tone === "success" && "bg-success/10 text-success ring-success/15",
            tone === "danger" && "bg-destructive/10 text-destructive ring-destructive/15",
            tone === "info" && "bg-info/10 text-info ring-info/15",
          )}
        >
          <Icon className="size-4" />
        </span>
        <div>
          <p className="font-serif text-xl font-semibold tabular-nums text-foreground">
            {formatNumber(value)}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
