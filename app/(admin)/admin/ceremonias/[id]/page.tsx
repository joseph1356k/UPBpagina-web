import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  GraduationCap,
  QrCode,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CeremonyStatusBadge, GraduateStatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import {
  getCeremony,
  getCeremonyStats,
  getGraduates,
} from "@/lib/mock";
import { ROUTES } from "@/lib/constants";
import {
  formatDateLong,
  formatTime,
  formatNumber,
  formatDocument,
  formatInitials,
} from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ceremony = await getCeremony(id);
  return {
    title: ceremony
      ? `${ceremony.name} — Ceremonias`
      : "Ceremonia no encontrada",
  };
}

export default async function CeremonyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ceremony, graduates] = await Promise.all([
    getCeremony(id),
    getGraduates({ ceremonyId: id }),
  ]);

  if (!ceremony) notFound();

  const stats = await getCeremonyStats(id);

  const registrationPct = stats.graduatesCount
    ? Math.round((stats.graduatesRegistered / stats.graduatesCount) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Back */}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href={ROUTES.adminCeremonias}>
            <ArrowLeft className="size-3.5" />
            Volver a ceremonias
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Ceremonia de grado
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold leading-tight text-foreground md:text-[1.7rem]">
            {ceremony.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0" />
              {formatDateLong(ceremony.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" />
              {formatTime(ceremony.startTime)} – {formatTime(ceremony.endTime)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              {ceremony.venue}, {ceremony.campus}
            </span>
          </div>
        </div>
        <div className="mt-2 sm:mt-0 shrink-0">
          <CeremonyStatusBadge status={ceremony.status} showDot />
        </div>
      </div>

      {/* Stats */}
      <section
        aria-label="Indicadores de la ceremonia"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          label="Graduandos"
          value={`${formatNumber(stats.graduatesRegistered)}/${formatNumber(stats.graduatesCount)}`}
          hint={`${registrationPct}% registrado`}
          icon={GraduationCap}
          accent="primary"
        />
        <StatCard
          label="Cupos usados"
          value={`${formatNumber(stats.cuposUsed)}/${formatNumber(stats.cuposTotal)}`}
          hint="Invitados registrados"
          icon={Users}
          accent="info"
        />
        <StatCard
          label="Invitaciones enviadas"
          value={formatNumber(stats.guestsInvited)}
          hint="QR generados"
          icon={QrCode}
          accent="primary"
        />
        <StatCard
          label="Ingresos confirmados"
          value={formatNumber(stats.guestsCheckedIn)}
          hint="Validados el día del evento"
          icon={Users}
          accent="success"
        />
      </section>

      <Separator />

      {/* Ceremony info */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Facultad" value={ceremony.faculty} />
            <Row label="Campus" value={ceremony.campus} />
            <Row label="Lugar" value={ceremony.venue} />
            <Row label="Cupos por defecto" value={String(ceremony.maxGuestsDefault)} />
            <Row
              label="Cierre de registro"
              value={formatDateLong(ceremony.registrationClosesAt)}
            />
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avance de registro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProgressItem
              label="Graduandos registrados"
              value={stats.graduatesRegistered}
              total={stats.graduatesCount}
            />
            <ProgressItem
              label="Cupos consumidos"
              value={stats.cuposUsed}
              total={stats.cuposTotal}
            />
            <ProgressItem
              label="Invitaciones con QR"
              value={stats.guestsInvited}
              total={stats.cuposUsed}
            />
          </CardContent>
        </Card>
      </section>

      {/* Graduates table */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Graduandos ({graduates.length})
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link
              href={`${ROUTES.adminGraduandos}?ceremony=${ceremony.id}`}
            >
              Ver en lista completa
            </Link>
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Graduando</TableHead>
                <TableHead className="hidden sm:table-cell">Documento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell text-right pr-4">
                  Cupos
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {graduates.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className="hidden sm:flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.68rem] font-semibold text-primary"
                      >
                        {formatInitials(g.fullName)}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`${ROUTES.adminGraduandos}/${g.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline underline-offset-4"
                        >
                          {g.fullName}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {g.program}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell tabular-nums">
                    {formatDocument(g.documentNumber)}
                  </TableCell>
                  <TableCell>
                    <GraduateStatusBadge status={g.status} showDot />
                  </TableCell>
                  <TableCell className="hidden text-right text-sm tabular-nums text-muted-foreground pr-4 md:table-cell">
                    {g.maxGuests}
                  </TableCell>
                </TableRow>
              ))}
              {graduates.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No hay graduandos en esta ceremonia.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-muted-foreground">{label}</p>
      <p className="text-right font-medium text-foreground">{value}</p>
    </div>
  );
}

function ProgressItem({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold tabular-nums text-foreground">
          {formatNumber(value)}
          <span className="font-normal text-muted-foreground">
            /{formatNumber(total)}
          </span>
        </p>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
