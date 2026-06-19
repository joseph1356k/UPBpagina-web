import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  History,
  QrCode,
  ScanLine,
  Upload,
  Users,
} from "lucide-react";

import { CeremonyStatusBadge, ScanResultBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { BarList } from "@/components/shared/charts/bar-list";
import { DonutStat } from "@/components/shared/charts/donut-stat";
import { Sparkline } from "@/components/shared/charts/sparkline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ROUTES, SCAN_DENIED_REASON_LABEL } from "@/lib/constants";
import {
  formatDateLong,
  formatNumber,
  formatRelativeFromNow,
  formatTime,
} from "@/lib/format";
import {
  getAuditLog,
  getCeremonyStats,
  getNextCeremony,
  getOverviewStats,
  getScanEventsAdmin,
  getUsers,
} from "@/lib/data";

export const metadata = {
  title: "Panel administrador",
};

export default async function AdminDashboardPage() {
  const [stats, nextCer, audit, scansAll, users] = await Promise.all([
    getOverviewStats(),
    getNextCeremony(),
    getAuditLog({ limit: 6 }),
    getScanEventsAdmin(),
    getUsers(),
  ]);
  const cerStats = nextCer ? await getCeremonyStats(nextCer.id) : null;
  const userById = new Map(users.map((u) => [u.id, u]));
  const scans = scansAll.slice(0, 5);
  const scanBuckets = scanBucketsLast24h(scansAll);
  const scans24h = scanBuckets.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Panel administrador"
        title="Resumen general"
        description="Estado actual de tus eventos, registros y validaciones de ingreso."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={ROUTES.adminImportar}>
                <Upload className="size-4" />
                Importar base
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={ROUTES.adminCeremonias}>
                Nuevo evento
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        }
      />

      <section
        aria-label="Indicadores clave"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          label="Eventos activos"
          value={stats.activeCeremonies}
          hint={`${stats.totalCeremonies} en el historial`}
          icon={CalendarCheck}
          accent="info"
        />
        <StatCard
          label="Participantes registrados"
          value={`${formatNumber(stats.graduatesRegistered)}/${formatNumber(stats.totalGraduates)}`}
          hint={`${Math.round((stats.graduatesRegistered / Math.max(stats.totalGraduates, 1)) * 100)}% de la base`}
          icon={Users}
          accent="primary"
        />
        <StatCard
          label="Invitaciones con QR"
          value={formatNumber(stats.totalGuestsInvited)}
          hint="Enviadas y vigentes"
          icon={QrCode}
          accent="primary"
        />
        <StatCard
          label="Ingresos validados"
          value={formatNumber(stats.totalCheckedIn)}
          hint={`${stats.scanEventsLast24h} escaneos en 24 h`}
          icon={CheckCircle2}
          accent="success"
        />
      </section>

      {/* Analítica */}
      <section aria-label="Analítica" className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-muted-foreground" />
              Embudo de registro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              formatValue={formatNumber}
              items={[
                {
                  label: "Participantes registrados",
                  value: stats.graduatesRegistered,
                  tone: "info",
                },
                {
                  label: "Invitaciones con QR",
                  value: stats.totalGuestsInvited,
                  tone: "primary",
                },
                {
                  label: "Ingresos validados",
                  value: stats.totalCheckedIn,
                  tone: "success",
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ocupación · próximo evento</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center gap-4 py-2">
            {nextCer && cerStats && cerStats.capacity != null ? (
              <>
                <DonutStat
                  value={cerStats.guestsCheckedIn}
                  total={cerStats.capacity}
                  tone="success"
                  sublabel="aforo"
                />
                <div>
                  <p className="font-serif text-2xl font-semibold tabular-nums text-foreground">
                    {formatNumber(cerStats.guestsCheckedIn)}
                    <span className="text-muted-foreground">
                      /{formatNumber(cerStats.capacity)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">ingresos / aforo</p>
                </div>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {nextCer
                  ? "El próximo evento no tiene aforo definido."
                  : "No hay eventos próximos."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Escaneos (24 h)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center gap-3 py-2">
            <Sparkline
              data={scanBuckets}
              label="Escaneos por hora en las últimas 24 horas"
            />
            <p className="text-xs text-muted-foreground">
              {formatNumber(scans24h)} escaneos en las últimas 24 horas
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
        {nextCer && cerStats ? (
          <NextCeremonyCard
            ceremony={nextCer}
            stats={cerStats}
          />
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No hay eventos próximos.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="size-4 text-muted-foreground" />
                Actividad reciente
              </CardTitle>
              <Button asChild variant="ghost" size="xs">
                <Link href={ROUTES.adminAuditoria}>
                  Ver todo
                  <ArrowUpRight className="size-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-0 p-0">
            {audit.map((entry, idx) => {
              const actor = userById.get(entry.actorId);
              return (
                <div
                  key={entry.id}
                  className="flex gap-3 px-4 py-3 hover:bg-muted/40"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[0.65rem] font-semibold text-muted-foreground"
                  >
                    {actor
                      ? actor.fullName
                          .split(" ")
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join("")
                          .toUpperCase()
                      : "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-foreground/90">
                      {entry.summary}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {actor?.fullName ?? "Sistema"} ·{" "}
                      {formatRelativeFromNow(entry.at)}
                    </p>
                  </div>
                  {idx < audit.length - 1 ? null : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ScanLine className="size-4 text-muted-foreground" />
                Escaneos recientes
              </CardTitle>
              <Button asChild variant="ghost" size="xs">
                <Link href={ROUTES.adminEscaneos}>
                  Ver historial
                  <ArrowUpRight className="size-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col p-0">
            {scans.map((scan, idx) => (
              <div
                key={scan.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx < scans.length - 1 ? "border-b border-border/60" : ""
                }`}
              >
                <ScanResultBadge result={scan.result} showDot />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {scan.result === "allowed"
                      ? `${scan.guestName ?? "Invitado"} ingresó`
                      : `Rechazo: ${
                          scan.reason
                            ? SCAN_DENIED_REASON_LABEL[scan.reason]
                            : "motivo no especificado"
                        }`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {scan.scannedByName}
                    {scan.ceremonyName ? ` · ${scan.ceremonyName}` : ""} ·{" "}
                    {formatRelativeFromNow(scan.scannedAt)}
                  </p>
                </div>
              </div>
            ))}
            {scans.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Sin escaneos recientes.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <QuickActions />
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface NextCeremonyCardProps {
  ceremony: import("@/lib/types").Ceremony;
  stats: import("@/lib/types").CeremonyStats;
}

function NextCeremonyCard({ ceremony, stats }: NextCeremonyCardProps) {
  const registrationPct = stats.graduatesCount
    ? (stats.graduatesRegistered / stats.graduatesCount) * 100
    : 0;
  const cupoPct = stats.cuposTotal
    ? (stats.cuposUsed / stats.cuposTotal) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Próximo evento
            </p>
            <CeremonyStatusBadge status={ceremony.status} showDot />
          </div>
          <CardTitle className="text-xl">{ceremony.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-4 text-sm sm:grid-cols-3">
          <Detail label="Fecha" value={formatDateLong(ceremony.date)} />
          <Detail
            label="Horario"
            value={`${formatTime(ceremony.startTime)} – ${formatTime(
              ceremony.endTime,
            )}`}
          />
          <Detail
            label="Lugar"
            value={`${ceremony.venue} · ${ceremony.campus}`}
          />
        </div>

        <Separator />

        <div className="grid gap-5 sm:grid-cols-2">
          <ProgressItem
            label="Participantes registrados"
            value={stats.graduatesRegistered}
            total={stats.graduatesCount}
            percent={registrationPct}
          />
          <ProgressItem
            label="Cupos consumidos"
            value={stats.cuposUsed}
            total={stats.cuposTotal}
            percent={cupoPct}
            tone="accent"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Registro cierra {formatRelativeFromNow(ceremony.registrationClosesAt)}.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href={ROUTES.adminCeremonias}>
              Ver detalle
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

function ProgressItem({
  label,
  value,
  total,
  percent,
  tone = "primary",
}: {
  label: string;
  value: number;
  total: number;
  percent: number;
  tone?: "primary" | "accent";
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-foreground/90">{label}</p>
        <p className="font-serif text-sm font-semibold tabular-nums">
          {formatNumber(value)}
          <span className="text-muted-foreground">/{formatNumber(total)}</span>
        </p>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${
            tone === "primary" ? "bg-primary" : "bg-success"
          }`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {Math.round(percent)}% completado
      </p>
    </div>
  );
}

/** Scans per hour over the last 24 h (24 buckets; index 23 = current hour). */
function scanBucketsLast24h(scans: { scannedAt: string }[]): number[] {
  const now = Date.now();
  const buckets = Array.from({ length: 24 }, () => 0);
  for (const s of scans) {
    const hoursAgo = Math.floor(
      (now - new Date(s.scannedAt).getTime()) / 3_600_000,
    );
    if (hoursAgo >= 0 && hoursAgo < 24) buckets[23 - hoursAgo] += 1;
  }
  return buckets;
}

function QuickActions() {
  const actions = [
    {
      label: "Importar participantes",
      hint: "Excel o CSV con preview",
      href: ROUTES.adminImportar,
      icon: Upload,
    },
    {
      label: "Ver participantes",
      hint: "Búsqueda y filtros",
      href: ROUTES.adminGraduandos,
      icon: Users,
    },
    {
      label: "Reportes",
      hint: "Exportación a CSV",
      href: ROUTES.adminReportes,
      icon: QrCode,
    },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Acciones rápidas</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 p-3">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group/quick flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/60"
          >
            <span
              aria-hidden
              className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15"
            >
              <a.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.hint}</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover/quick:translate-x-0.5" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
