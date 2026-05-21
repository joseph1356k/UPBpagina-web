"use client";

import { useState, useTransition, useEffect } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  History,
  Loader2,
  RotateCcw,
  ScanLine,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { simulateScan, type SimulatedScanResult } from "@/lib/mock";
import { ROUTES, SCAN_DENIED_REASON_LABEL } from "@/lib/constants";
import { formatDocument, formatInitials, formatTime } from "@/lib/format";
import type { Ceremony, ScanDeniedReason, User } from "@/lib/types";
import { cn } from "@/lib/utils";

/* Pretend "logged-in scanner" — replace with auth when wired to Supabase */
const FALLBACK_OPERATOR_NAME = "Operador de turno";

interface Props {
  operator: User | null;
  ceremonies: Ceremony[];
}

type ScanState =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "result"; data: SimulatedScanResult };

export function ScannerUI({ operator, ceremonies }: Props) {
  const activeOptions =
    ceremonies.filter((c) => c.status === "open" || c.status === "in_progress");
  const fallbackCeremony =
    activeOptions[0]?.id ?? ceremonies[0]?.id ?? "";

  const [ceremonyId, setCeremonyId] = useState(fallbackCeremony);
  const [state, setState] = useState<ScanState>({ kind: "idle" });
  const [stats, setStats] = useState({ allowed: 0, denied: 0 });
  const [isPending, startTransition] = useTransition();

  const operatorName = operator?.fullName ?? FALLBACK_OPERATOR_NAME;
  const operatorId = operator?.id ?? "usr_scan_demo";
  const activeCeremony = ceremonies.find((c) => c.id === ceremonyId);

  function doScan() {
    if (!ceremonyId) return;
    setState({ kind: "scanning" });
    startTransition(async () => {
      // simulate camera "focus" delay
      await new Promise((r) => setTimeout(r, 900));
      const result = await simulateScan({
        scannedByUserId: operatorId,
        ceremonyId,
      });
      setState({ kind: "result", data: result });
      setStats((s) => ({
        allowed: s.allowed + (result.result === "allowed" ? 1 : 0),
        denied: s.denied + (result.result === "denied" ? 1 : 0),
      }));
    });
  }

  function reset() {
    setState({ kind: "idle" });
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar with operator + stats */}
      <div className="border-b border-white/10 bg-foreground/95 px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-background"
            >
              {formatInitials(operatorName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-background">
                {operatorName}
              </p>
              <p className="truncate text-[0.7rem] uppercase tracking-wide text-background/55">
                Personal de escaneo
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Stat label="OK" value={stats.allowed} tone="ok" />
            <Stat label="No" value={stats.denied} tone="bad" />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-background/80 hover:bg-white/10 hover:text-background"
            >
              <Link href={ROUTES.scannerHistorial}>
                <History className="size-3.5" />
                Historial
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-6">
        {/* Ceremony selector */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-background/55">
            Ceremonia activa
          </label>
          <Select value={ceremonyId} onValueChange={(v) => setCeremonyId(String(v ?? ""))}>
            <SelectTrigger className="h-10 w-full border-white/15 bg-white/5 text-background hover:bg-white/10">
              <SelectValue placeholder="Selecciona la ceremonia" />
            </SelectTrigger>
            <SelectContent>
              {ceremonies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeCeremony && (
            <p className="mt-1.5 text-xs text-background/60">
              {activeCeremony.venue} · {activeCeremony.campus} ·{" "}
              {formatTime(activeCeremony.startTime)}
            </p>
          )}
        </div>

        {/* Viewfinder */}
        <ScannerViewfinder
          state={state}
          onScan={doScan}
          onReset={reset}
          canScan={Boolean(ceremonyId) && !isPending}
        />

        {/* Result panel */}
        {state.kind === "result" && (
          <ScanResultCard data={state.data} onContinue={reset} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Viewfinder                                                         */
/* ------------------------------------------------------------------ */

function ScannerViewfinder({
  state,
  onScan,
  onReset,
  canScan,
}: {
  state: ScanState;
  onScan: () => void;
  onReset: () => void;
  canScan: boolean;
}) {
  // Smooth shimmer animation during scan
  const scanning = state.kind === "scanning";
  const hasResult = state.kind === "result";

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-2xl border bg-foreground/60 transition-colors",
          scanning
            ? "border-primary/60"
            : hasResult
              ? state.data.result === "allowed"
                ? "border-success/60"
                : "border-destructive/60"
              : "border-white/10",
        )}
      >
        {/* "Camera" background — radial gradient */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_70%)]"
        />

        {/* Frame corners */}
        <Corners />

        {/* Center icon / state */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          {state.kind === "idle" && (
            <>
              <Camera className="size-10 text-background/40" />
              <p className="text-sm text-background/70">
                Coloca el QR del invitado dentro del recuadro
              </p>
            </>
          )}
          {scanning && (
            <>
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="text-sm text-background/80">Leyendo código…</p>
            </>
          )}
          {hasResult && (
            <ResultBadge result={state.data.result} reason={state.data.reason} />
          )}
        </div>

        {/* Scan line animation */}
        {scanning && <ScanLineAnim />}
      </div>

      {/* Action */}
      {hasResult ? (
        <Button
          onClick={onReset}
          size="lg"
          className="h-11 w-full text-base"
          variant="outline"
        >
          <RotateCcw className="size-4" />
          Escanear siguiente
        </Button>
      ) : (
        <Button
          onClick={onScan}
          disabled={!canScan}
          size="lg"
          className="h-11 w-full text-base"
        >
          <ScanLine className="size-4" />
          {scanning ? "Escaneando…" : "Simular escaneo de QR"}
        </Button>
      )}
    </div>
  );
}

function Corners() {
  const cornerCls =
    "absolute size-8 border-background/60";
  return (
    <>
      <span className={cn(cornerCls, "left-4 top-4 border-l-2 border-t-2 rounded-tl-lg")} />
      <span className={cn(cornerCls, "right-4 top-4 border-r-2 border-t-2 rounded-tr-lg")} />
      <span className={cn(cornerCls, "left-4 bottom-4 border-l-2 border-b-2 rounded-bl-lg")} />
      <span className={cn(cornerCls, "right-4 bottom-4 border-r-2 border-b-2 rounded-br-lg")} />
    </>
  );
}

function ScanLineAnim() {
  return (
    <div
      aria-hidden
      className="absolute inset-x-6 top-6 bottom-6 overflow-hidden"
    >
      <div className="absolute inset-x-0 h-0.5 animate-scan bg-primary/80 shadow-[0_0_18px_2px_rgb(0,150,90)]" />
      <style jsx>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: calc(100% - 2px);
          }
          100% {
            top: 0;
          }
        }
        :global(.animate-scan) {
          animation: scan 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Result card                                                        */
/* ------------------------------------------------------------------ */

function ResultBadge({
  result,
  reason,
}: {
  result: "allowed" | "denied";
  reason: ScanDeniedReason | null;
}) {
  if (result === "allowed") {
    return (
      <>
        <CheckCircle2 className="size-12 text-success" />
        <p className="text-lg font-semibold text-background">
          Ingreso permitido
        </p>
      </>
    );
  }
  return (
    <>
      <XCircle className="size-12 text-destructive" />
      <p className="text-lg font-semibold text-background">
        Ingreso denegado
      </p>
      {reason && (
        <p className="text-xs text-background/70">
          {SCAN_DENIED_REASON_LABEL[reason]}
        </p>
      )}
    </>
  );
}

function ScanResultCard({
  data,
  onContinue,
}: {
  data: SimulatedScanResult;
  onContinue: () => void;
}) {
  const { result, reason, guest, graduate, ceremonyName } = data;
  const isAllowed = result === "allowed";

  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        isAllowed
          ? "border-success/30 bg-success/8"
          : "border-destructive/30 bg-destructive/8",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            isAllowed
              ? "bg-success/20 text-success"
              : "bg-destructive/20 text-destructive",
          )}
        >
          {isAllowed ? (
            <CheckCircle2 className="size-5" />
          ) : (
            <AlertTriangle className="size-5" />
          )}
        </span>
        <div>
          <p
            className={cn(
              "font-medium",
              isAllowed ? "text-success" : "text-destructive",
            )}
          >
            {isAllowed ? "Bienvenida" : "No puede ingresar"}
          </p>
          {reason && (
            <p className="text-xs text-background/70">
              {SCAN_DENIED_REASON_LABEL[reason]}
            </p>
          )}
        </div>
      </div>

      {/* Guest info */}
      {guest ? (
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
          <DetailRow label="Invitado" value={guest.fullName} />
          {guest.documentNumber && (
            <DetailRow
              label="Documento"
              value={formatDocument(guest.documentNumber)}
            />
          )}
          {graduate && (
            <DetailRow label="Graduando" value={graduate.fullName} />
          )}
          {ceremonyName && (
            <DetailRow label="Ceremonia" value={ceremonyName} />
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-background/75">
          No se encontró información del invitado. Verifica que el QR sea
          válido.
        </p>
      )}

      <Button
        onClick={onContinue}
        className="mt-5 w-full"
        variant={isAllowed ? "default" : "outline"}
        size="lg"
      >
        Continuar escaneando
      </Button>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-background/60">{label}</span>
      <span className="text-right font-medium text-background">{value}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "bad";
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          tone === "ok" ? "bg-success" : "bg-destructive",
        )}
      />
      <span className="text-xs text-background/60">{label}</span>
      <span className="font-semibold tabular-nums text-background">
        {value}
      </span>
    </div>
  );
}

/* Keep the wakelock-style behavior friendly even without real camera */
export function ScannerHints() {
  const [showHint, setShowHint] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 6000);
    return () => clearTimeout(t);
  }, []);
  if (!showHint) return null;
  return null;
}
