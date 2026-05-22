import Link from "next/link";
import { ArrowLeft, ScanLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScanResultBadge } from "@/components/shared/status-badge";
import { Separator } from "@/components/ui/separator";
import { getScanEventsAdmin, getUsers } from "@/lib/data";
import { ROUTES, SCAN_DENIED_REASON_LABEL } from "@/lib/constants";
import { formatDateTime, formatRelativeFromNow } from "@/lib/format";

export const metadata = {
  title: "Historial — Escáner",
};

export default async function ScannerHistoryPage() {
  const [scanEvents, users] = await Promise.all([
    getScanEventsAdmin(),
    getUsers(),
  ]);

  // Pretend the operator is the first active scanner user.
  const operator = users.find((u) => u.role === "scanner" && u.active);
  const myEvents = operator
    ? scanEvents.filter((e) => e.scannedByUserId === operator.id)
    : scanEvents.slice(0, 30);

  const allowedCount = myEvents.filter((e) => e.result === "allowed").length;
  const deniedCount = myEvents.filter((e) => e.result === "denied").length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      {/* Back */}
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="self-start text-background/70 hover:bg-white/10 hover:text-background"
      >
        <Link href={ROUTES.scanner}>
          <ArrowLeft className="size-3.5" />
          Volver al escáner
        </Link>
      </Button>

      <header>
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-background/55">
          Personal de escaneo
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-background">
          Historial de escaneos
        </h1>
        <p className="mt-2 text-sm text-background/70">
          Últimos códigos validados por{" "}
          <span className="text-background">
            {operator?.fullName ?? "tu turno"}
          </span>
          .
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatChip label="Permitidos" value={allowedCount} tone="ok" />
        <StatChip label="Rechazados" value={deniedCount} tone="bad" />
      </div>

      <Separator className="bg-white/10" />

      {/* List */}
      {myEvents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center">
          <ScanLine className="size-6 text-background/40" />
          <p className="text-sm text-background/70">
            Aún no has escaneado ningún QR en este turno.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {myEvents.map((e) => (
            <li
              key={e.id}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <ScanResultBadge result={e.result} showDot />
                <span
                  className="text-xs text-background/55"
                  title={formatDateTime(e.scannedAt)}
                >
                  {formatRelativeFromNow(e.scannedAt)}
                </span>
              </div>
              <p className="mt-2 text-sm text-background">
                {e.guestName ?? "QR sin coincidencia"}
              </p>
              <p className="text-xs text-background/60">
                {e.result === "allowed"
                  ? e.ceremonyName ?? "Ceremonia desconocida"
                  : SCAN_DENIED_REASON_LABEL[e.reason ?? "not_found"]}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "bad";
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden
          className={`size-1.5 rounded-full ${tone === "ok" ? "bg-success" : "bg-destructive"}`}
        />
        <p className="text-xs text-background/65">{label}</p>
      </div>
      <p className="mt-1 font-serif text-2xl font-semibold text-background tabular-nums">
        {value}
      </p>
    </div>
  );
}
