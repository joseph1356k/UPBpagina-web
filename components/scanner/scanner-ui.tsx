"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  Download,
  History,
  Keyboard,
  Loader2,
  RotateCcw,
  ScanLine,
  Search,
  UserRound,
  WifiOff,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import QrScanner from "qr-scanner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Mock data fns only used when NEXT_PUBLIC_USE_SUPABASE is off.
import {
  getScanManifest as mockGetManifest,
  manualCheckIn as mockManualCheckIn,
  searchCeremonyGuests as mockSearchGuests,
  simulateScan,
} from "@/lib/mock";
import {
  GUEST_STATUS_LABEL,
  ROUTES,
  SCAN_DENIED_REASON_LABEL,
} from "@/lib/constants";
import {
  formatDocument,
  formatInitials,
  formatRelativeFromNow,
  formatTime,
} from "@/lib/format";
import { useOnline } from "@/lib/pwa/use-online";
import { enqueueScan } from "@/lib/pwa/scan-queue";
import {
  hasOfflineCheckIn,
  loadManifest,
  recordOfflineCheckIn,
  saveManifest,
  type StoredManifest,
} from "@/lib/pwa/manifest";
import { USE_SUPABASE } from "@/lib/supabase/env";
import type { GuestSearchRow } from "@/lib/mock";
import type { Ceremony, ScanDeniedReason, User } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  operator: User | null;
  ceremonies: Ceremony[];
}

/** Normalized result shape shared between mock + real paths. */
interface ScanOutcome {
  result: "allowed" | "denied" | "queued";
  reason: ScanDeniedReason | null;
  /** Non-blocking warning (e.g. admitted while over capacity). */
  warning?: ScanDeniedReason | null;
  /** Decided locally against the offline manifest (will reconcile later). */
  offline?: boolean;
  guestName: string | null;
  guestDocument: string | null;
  graduateName: string | null;
  ceremonyName: string | null;
}

type ScanState =
  | { kind: "idle" }
  | { kind: "camera" }
  | { kind: "validating" }
  | { kind: "result"; data: ScanOutcome };

/** Extract the token from a scanned QR. Accepts both the bare token and
 *  the full invitation URL (https://…/invitacion/<token>). */
function extractToken(raw: string): string | null {
  const text = raw.trim();
  const urlMatch = /\/invitacion\/([a-zA-Z0-9_-]{16,128})/.exec(text);
  if (urlMatch) return urlMatch[1];
  if (/^[a-zA-Z0-9_-]{16,128}$/.test(text)) return text;
  return null;
}

export function ScannerUI({ operator, ceremonies }: Props) {
  const activeOptions = ceremonies.filter(
    (c) => c.status === "open" || c.status === "in_progress",
  );
  const fallbackCeremony = activeOptions[0]?.id ?? ceremonies[0]?.id ?? "";

  const [ceremonyId, setCeremonyId] = useState(fallbackCeremony);
  const [state, setState] = useState<ScanState>({ kind: "idle" });
  const [stats, setStats] = useState({ allowed: 0, denied: 0, queued: 0 });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<GuestSearchRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [manifest, setManifest] = useState<StoredManifest | null>(null);
  const [preparing, setPreparing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  // Guards re-entry while a validation is in flight (camera keeps firing)
  const busyRef = useRef(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest manifest, read inside validateToken without being a dep.
  const manifestRef = useRef<StoredManifest | null>(null);

  const operatorName = operator?.fullName ?? "Operador";
  const activeCeremony = ceremonies.find((c) => c.id === ceremonyId);
  const online = useOnline();

  /* ── Core: validate a decoded token ──────────────────────────────── */

  const validateToken = useCallback(
    async (token: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setState({ kind: "validating" });

      try {
        if (!USE_SUPABASE) {
          // Mock mode — run the simulator so the demo still works
          const r = await simulateScan({
            scannedByUserId: operator?.id ?? "usr_scan_demo",
            ceremonyId,
          });
          finishScan({
            result: r.result === "allowed" ? "allowed" : "denied",
            reason: r.reason,
            warning: r.warning ?? null,
            guestName: r.guest?.fullName ?? null,
            guestDocument: r.guest?.documentNumber ?? null,
            graduateName: r.graduate?.fullName ?? null,
            ceremonyName: r.ceremonyName,
          });
          return;
        }

        if (!online) {
          const offlineManifest = manifestRef.current;
          // Offline V2: decide locally against the pre-downloaded manifest.
          if (offlineManifest) {
            const entry = offlineManifest.entries.find((e) => e.token === token);
            let result: "allowed" | "denied" = "allowed";
            let reason: ScanDeniedReason | null = null;
            if (!entry) {
              result = "denied";
              reason = "not_found";
            } else if (entry.status === "revoked") {
              result = "denied";
              reason = "revoked";
            } else if (
              entry.status === "checked_in" ||
              (await hasOfflineCheckIn(token))
            ) {
              result = "denied";
              reason = "already_used";
            }
            if (result === "allowed") {
              await recordOfflineCheckIn(token, ceremonyId);
              await enqueueScan(token); // reconcile with the server on reconnect
            }
            finishScan({
              result,
              reason,
              offline: true,
              guestName: entry?.name ?? null,
              guestDocument: null,
              graduateName: null,
              ceremonyName: activeCeremony?.name ?? null,
            });
            return;
          }

          // No manifest downloaded → blind queue (legacy fallback).
          try {
            await enqueueScan(token);
            finishScan({
              result: "queued",
              reason: null,
              guestName: null,
              guestDocument: null,
              graduateName: null,
              ceremonyName: activeCeremony?.name ?? null,
            });
            setStats((s) => ({ ...s, queued: s.queued + 1 }));
          } catch {
            finishScan({
              result: "denied",
              reason: null,
              guestName: null,
              guestDocument: null,
              graduateName: null,
              ceremonyName: null,
            });
          }
          return;
        }

        const res = await fetch("/api/qr/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ token }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          result?: "allowed" | "denied";
          reason?: ScanDeniedReason | null;
          warning?: ScanDeniedReason | null;
          guestName?: string | null;
          graduateId?: string | null;
          error?: string;
        };

        if (!res.ok || !json.result) {
          finishScan({
            result: "denied",
            reason: (json.reason as ScanDeniedReason) ?? "not_found",
            guestName: json.guestName ?? null,
            guestDocument: null,
            graduateName: null,
            ceremonyName: activeCeremony?.name ?? null,
          });
          return;
        }

        finishScan({
          result: json.result,
          reason: json.reason ?? null,
          warning: json.warning ?? null,
          guestName: json.guestName ?? null,
          guestDocument: null,
          graduateName: null,
          ceremonyName: activeCeremony?.name ?? null,
        });
      } finally {
        busyRef.current = false;
      }
    },
    [ceremonyId, online, operator?.id, activeCeremony?.name],
  );

  function finishScan(outcome: ScanOutcome) {
    // Stop the camera while showing the result
    scannerRef.current?.stop();
    setState({ kind: "result", data: outcome });
    if (outcome.result === "allowed") {
      setStats((s) => ({ ...s, allowed: s.allowed + 1 }));
      playTone(880);
    } else if (outcome.result === "denied") {
      setStats((s) => ({ ...s, denied: s.denied + 1 }));
      playTone(220);
    }
    if (navigator.vibrate) {
      navigator.vibrate(outcome.result === "allowed" ? 80 : [80, 60, 80]);
    }
  }

  /* ── Camera lifecycle ────────────────────────────────────────────── */

  const startCamera = useCallback(async () => {
    setCameraError(null);
    const video = videoRef.current;
    if (!video) return;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new QrScanner(
          video,
          (res) => {
            const token = extractToken(res.data);
            if (token) void validateToken(token);
          },
          {
            preferredCamera: "environment",
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 4,
          },
        );
      }
      await scannerRef.current.start();
      setState({ kind: "camera" });
    } catch (err) {
      console.error("[scanner] camera failed:", err);
      setCameraError(
        "No se pudo acceder a la cámara. Revisa los permisos del navegador o usa la entrada manual.",
      );
      setState({ kind: "idle" });
    }
  }, [validateToken]);

  function resumeScanning() {
    setState({ kind: "idle" });
    void startCamera();
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scannerRef.current?.destroy();
      scannerRef.current = null;
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  /* ── Offline manifest (B4) ───────────────────────────────────────── */

  // Load any cached manifest for the active ceremony.
  useEffect(() => {
    let active = true;
    void loadManifest(ceremonyId).then((m) => {
      if (!active) return;
      manifestRef.current = m;
      setManifest(m);
    });
    return () => {
      active = false;
    };
  }, [ceremonyId]);

  const prepareOffline = useCallback(async () => {
    if (!ceremonyId) return;
    setPreparing(true);
    try {
      let m: {
        ceremonyId: string;
        generatedAt: string;
        entries: { token: string; name: string; status: string }[];
      } | null = null;
      if (!USE_SUPABASE) {
        m = await mockGetManifest(ceremonyId);
      } else {
        const res = await fetch(
          `/api/qr/manifest?ceremony=${encodeURIComponent(ceremonyId)}`,
          { credentials: "same-origin" },
        );
        const json = (await res.json().catch(() => ({}))) as {
          manifest?: {
            ceremonyId: string;
            generatedAt: string;
            entries: { token: string; name: string; status: string }[];
          };
        };
        m = json.manifest ?? null;
      }
      if (m && Array.isArray(m.entries)) {
        await saveManifest(m);
        const stored = await loadManifest(ceremonyId);
        manifestRef.current = stored;
        setManifest(stored);
      }
    } finally {
      setPreparing(false);
    }
  }, [ceremonyId]);

  /* ── Manual entry ─────────────────────────────────────────────────── */

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const token = extractToken(manualValue);
    if (!token) {
      setCameraError("El código ingresado no parece válido.");
      return;
    }
    setManualOpen(false);
    setManualValue("");
    void validateToken(token);
  }

  /* ── Search by name + manual check-in ────────────────────────────── */

  const runSearch = useCallback(
    async (q: string): Promise<GuestSearchRow[]> => {
      if (!USE_SUPABASE) return mockSearchGuests({ ceremonyId, query: q });
      const res = await fetch(
        `/api/qr/search?ceremony=${encodeURIComponent(ceremonyId)}&q=${encodeURIComponent(q)}`,
        { credentials: "same-origin" },
      );
      const json = (await res.json().catch(() => ({}))) as {
        results?: GuestSearchRow[];
      };
      return Array.isArray(json.results) ? json.results : [];
    },
    [ceremonyId],
  );

  // Debounce in the change handler (not an effect) so search stays off the
  // render path.
  function onSearchChange(value: string) {
    setSearchValue(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = value.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        setSearchResults(await runSearch(q));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
  }

  const manualCheckInGuest = useCallback(
    async (guestId: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setSearchOpen(false);
      setSearchValue("");
      setSearchResults([]);
      setState({ kind: "validating" });

      try {
        if (!USE_SUPABASE) {
          const r = await mockManualCheckIn({
            guestId,
            scannedByUserId: operator?.id ?? "usr_scan_demo",
          });
          finishScan({
            result: r.result === "allowed" ? "allowed" : "denied",
            reason: r.reason,
            warning: r.warning ?? null,
            guestName: r.guest?.fullName ?? null,
            guestDocument: r.guest?.documentNumber ?? null,
            graduateName: r.graduate?.fullName ?? null,
            ceremonyName: r.ceremonyName,
          });
          return;
        }

        const res = await fetch("/api/qr/manual-check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ guestId }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          result?: "allowed" | "denied";
          reason?: ScanDeniedReason | null;
          warning?: ScanDeniedReason | null;
          guestName?: string | null;
          guestDocument?: string | null;
          graduateName?: string | null;
          ceremonyName?: string | null;
        };
        if (!res.ok || !json.result) {
          finishScan({
            result: "denied",
            reason: (json.reason as ScanDeniedReason) ?? "not_found",
            guestName: json.guestName ?? null,
            guestDocument: null,
            graduateName: null,
            ceremonyName: activeCeremony?.name ?? null,
          });
          return;
        }
        finishScan({
          result: json.result,
          reason: json.reason ?? null,
          warning: json.warning ?? null,
          guestName: json.guestName ?? null,
          guestDocument: json.guestDocument ?? null,
          graduateName: json.graduateName ?? null,
          ceremonyName: json.ceremonyName ?? activeCeremony?.name ?? null,
        });
      } finally {
        busyRef.current = false;
      }
    },
    [operator?.id, activeCeremony?.name],
  );

  const showingCamera = state.kind === "camera" || state.kind === "validating";

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
            {stats.queued > 0 && (
              <Stat label="Cola" value={stats.queued} tone="queue" />
            )}
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
          <Select
            value={ceremonyId}
            onValueChange={(v) => setCeremonyId(String(v ?? ""))}
          >
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

        {/* Offline readiness (B4) */}
        <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            {manifest ? (
              <CheckCircle2 className="size-4 shrink-0 text-success" />
            ) : (
              <WifiOff className="size-4 shrink-0 text-background/45" />
            )}
            <p className="truncate text-xs text-background/70">
              {manifest
                ? `Listo sin conexión · ${formatRelativeFromNow(new Date(manifest.savedAt).toISOString())}`
                : online
                  ? "Prepara el modo sin conexión antes del evento"
                  : "Sin conexión y sin lista descargada"}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => void prepareOffline()}
            disabled={preparing || !online || !ceremonyId}
            className="shrink-0 text-background/80 hover:bg-white/10 hover:text-background"
          >
            {preparing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            {manifest ? "Actualizar" : "Preparar"}
          </Button>
        </div>

        {/* Viewfinder */}
        <div className="space-y-3">
          <div
            className={cn(
              "relative aspect-square w-full overflow-hidden rounded-2xl border bg-foreground/60 transition-colors",
              state.kind === "validating"
                ? "border-primary/60"
                : state.kind === "result"
                  ? state.data.result === "allowed"
                    ? "border-success/60"
                    : state.data.result === "queued"
                      ? "border-warning/60"
                      : "border-destructive/60"
                  : "border-white/10",
            )}
          >
            {/* Live camera feed */}
            <video
              ref={videoRef}
              className={cn(
                "absolute inset-0 size-full object-cover",
                !showingCamera && "hidden",
              )}
              muted
              playsInline
            />

            {/* Idle / result overlay */}
            {!showingCamera && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                {state.kind === "idle" && (
                  <>
                    <Camera className="size-10 text-background/40" />
                    <p className="text-sm text-background/70">
                      Activa la cámara y apunta al QR del invitado
                    </p>
                  </>
                )}
                {state.kind === "result" && (
                  <ResultBadge
                    result={state.data.result}
                    reason={state.data.reason}
                  />
                )}
              </div>
            )}

            {/* Validating overlay on top of the video */}
            {state.kind === "validating" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground/55">
                <Loader2 className="size-10 animate-spin text-primary" />
                <p className="text-sm text-background/85">Validando…</p>
              </div>
            )}

            <Corners />
          </div>

          {cameraError && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-warning">
              <CameraOff className="mt-0.5 size-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Primary action */}
          {state.kind === "result" ? (
            <Button
              onClick={resumeScanning}
              size="lg"
              className="h-11 w-full text-base"
            >
              <RotateCcw className="size-4" />
              Escanear siguiente
            </Button>
          ) : showingCamera ? (
            <Button
              onClick={() => {
                scannerRef.current?.stop();
                setState({ kind: "idle" });
              }}
              size="lg"
              variant="outline"
              className="h-11 w-full text-base"
            >
              <CameraOff className="size-4" />
              Detener cámara
            </Button>
          ) : (
            <Button
              onClick={() => void startCamera()}
              disabled={!ceremonyId}
              size="lg"
              className="h-11 w-full text-base"
            >
              <ScanLine className="size-4" />
              Iniciar cámara
            </Button>
          )}

          {/* Manual entry toggle */}
          {state.kind !== "result" && (
            <button
              type="button"
              onClick={() => {
                setManualOpen((v) => !v);
                setSearchOpen(false);
              }}
              className="mx-auto flex items-center gap-1.5 text-xs text-background/60 underline-offset-4 hover:text-background hover:underline"
            >
              <Keyboard className="size-3.5" />
              Ingresar código manualmente
            </button>
          )}

          {manualOpen && state.kind !== "result" && (
            <form onSubmit={submitManual} className="flex gap-2">
              <Input
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder="Pega el enlace o el código del pase"
                className="h-10 border-white/15 bg-white/5 text-background placeholder:text-background/40"
                autoFocus
              />
              <Button type="submit" className="h-10 shrink-0">
                Validar
              </Button>
            </form>
          )}

          {/* Search-by-name toggle (manual check-in without QR) */}
          {state.kind !== "result" && (
            <button
              type="button"
              onClick={() => {
                setSearchOpen((v) => !v);
                setManualOpen(false);
              }}
              className="mx-auto flex items-center gap-1.5 text-xs text-background/60 underline-offset-4 hover:text-background hover:underline"
            >
              <Search className="size-3.5" />
              Buscar invitado por nombre
            </button>
          )}

          {searchOpen && state.kind !== "result" && (
            <div className="space-y-2">
              <Input
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Nombre o documento del invitado"
                className="h-10 border-white/15 bg-white/5 text-background placeholder:text-background/40"
                autoFocus
              />
              <div className="max-h-72 overflow-y-auto rounded-lg border border-white/10">
                {searching ? (
                  <p className="px-3 py-4 text-center text-sm text-background/60">
                    Buscando…
                  </p>
                ) : searchResults.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-background/50">
                    {searchValue.trim().length < 2
                      ? "Escribe al menos 2 caracteres."
                      : "Sin coincidencias."}
                  </p>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {searchResults.map((g) => {
                      const admitted = g.status === "checked_in";
                      const blocked = g.status === "revoked";
                      const disabled = admitted || blocked;
                      return (
                        <li key={g.id}>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => void manualCheckInGuest(g.id)}
                            className={cn(
                              "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                              disabled
                                ? "cursor-not-allowed opacity-60"
                                : "hover:bg-white/5",
                            )}
                          >
                            <UserRound className="size-4 shrink-0 text-background/50" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-background">
                                {g.fullName}
                              </p>
                              <p className="truncate text-xs text-background/55">
                                {g.documentNumber
                                  ? formatDocument(g.documentNumber)
                                  : g.graduateName}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
                                admitted
                                  ? "bg-success/15 text-success"
                                  : blocked
                                    ? "bg-destructive/15 text-destructive"
                                    : "bg-white/10 text-background/70",
                              )}
                            >
                              {GUEST_STATUS_LABEL[g.status]}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Result panel */}
        {state.kind === "result" && (
          <ScanResultCard data={state.data} onContinue={resumeScanning} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feedback tone (Web Audio — no asset download)                     */
/* ------------------------------------------------------------------ */

function playTone(freq: number) {
  try {
    type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
    const Ctor =
      window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
    osc.onended = () => void ctx.close();
  } catch {
    // Audio unavailable — silent fallback
  }
}

/* ------------------------------------------------------------------ */
/*  Decorations                                                        */
/* ------------------------------------------------------------------ */

function Corners() {
  const cornerCls = "absolute size-8 border-background/60 pointer-events-none";
  return (
    <>
      <span className={cn(cornerCls, "left-4 top-4 border-l-2 border-t-2 rounded-tl-lg")} />
      <span className={cn(cornerCls, "right-4 top-4 border-r-2 border-t-2 rounded-tr-lg")} />
      <span className={cn(cornerCls, "left-4 bottom-4 border-l-2 border-b-2 rounded-bl-lg")} />
      <span className={cn(cornerCls, "right-4 bottom-4 border-r-2 border-b-2 rounded-br-lg")} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Result UI                                                          */
/* ------------------------------------------------------------------ */

function ResultBadge({
  result,
  reason,
}: {
  result: "allowed" | "denied" | "queued";
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
  if (result === "queued") {
    return (
      <>
        <Loader2 className="size-12 text-warning" />
        <p className="text-lg font-semibold text-background">
          Guardado sin conexión
        </p>
        <p className="text-xs text-background/70">
          Se validará automáticamente al recuperar internet.
        </p>
      </>
    );
  }
  return (
    <>
      <XCircle className="size-12 text-destructive" />
      <p className="text-lg font-semibold text-background">Ingreso denegado</p>
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
  data: ScanOutcome;
  onContinue: () => void;
}) {
  const { result, reason, guestName, guestDocument, graduateName, ceremonyName } =
    data;
  const isAllowed = result === "allowed";
  const isQueued = result === "queued";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-2xl border p-5",
        isAllowed
          ? "border-success/30 bg-success/8"
          : isQueued
            ? "border-warning/30 bg-warning/8"
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
              : isQueued
                ? "bg-warning/20 text-warning"
                : "bg-destructive/20 text-destructive",
          )}
        >
          {isAllowed ? (
            <CheckCircle2 className="size-5" />
          ) : isQueued ? (
            <Loader2 className="size-5" />
          ) : (
            <AlertTriangle className="size-5" />
          )}
        </span>
        <div>
          <p
            className={cn(
              "font-medium",
              isAllowed
                ? "text-success"
                : isQueued
                  ? "text-warning"
                  : "text-destructive",
            )}
          >
            {isAllowed
              ? "Puede ingresar"
              : isQueued
                ? "En cola de sincronización"
                : "No puede ingresar"}
          </p>
          {reason && (
            <p className="text-xs text-background/70">
              {SCAN_DENIED_REASON_LABEL[reason]}
            </p>
          )}
        </div>
      </div>

      {data.warning === "capacity_full" && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="size-4 shrink-0" />
          Aforo superado — ingreso permitido por excepción.
        </div>
      )}

      {data.offline && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-background/70">
          <WifiOff className="size-4 shrink-0" />
          Validado sin conexión — se sincronizará al reconectar.
        </div>
      )}

      {/* Guest info */}
      {guestName ? (
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
          <DetailRow label="Invitado" value={guestName} />
          {guestDocument && (
            <DetailRow label="Documento" value={formatDocument(guestDocument)} />
          )}
          {graduateName && <DetailRow label="Graduando" value={graduateName} />}
          {ceremonyName && <DetailRow label="Ceremonia" value={ceremonyName} />}
        </div>
      ) : isQueued ? null : (
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
  tone: "ok" | "bad" | "queue";
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          tone === "ok"
            ? "bg-success"
            : tone === "queue"
              ? "bg-warning"
              : "bg-destructive",
        )}
      />
      <span className="text-xs text-background/60">{label}</span>
      <span className="font-semibold tabular-nums text-background">{value}</span>
    </div>
  );
}
