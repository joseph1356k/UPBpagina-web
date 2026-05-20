import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Hash, BookOpen, Users } from "lucide-react";

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
import {
  GraduateStatusBadge,
  GuestStatusBadge,
} from "@/components/shared/status-badge";
import {
  getCeremony,
  getGraduate,
  getGuests,
} from "@/lib/mock";
import { DOCUMENT_TYPE_LABEL, ROUTES } from "@/lib/constants";
import {
  formatDateShort,
  formatDateTime,
  formatDocument,
  formatInitials,
} from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const graduate = await getGraduate(id);
  return {
    title: graduate
      ? `${graduate.fullName} — Graduandos`
      : "Graduando no encontrado",
  };
}

export default async function GraduateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [graduate, guests] = await Promise.all([
    getGraduate(id),
    getGuests({ graduateId: id }),
  ]);

  if (!graduate) notFound();

  const ceremony = await getCeremony(graduate.ceremonyId);
  const guestsUsed = guests.filter((g) => g.status !== "revoked").length;
  const guestsWithQR = guests.filter(
    (g) => g.status === "invited" || g.status === "checked_in",
  ).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Back */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
        >
          <Link href={ROUTES.adminGraduandos}>
            <ArrowLeft className="size-3.5" />
            Volver a graduandos
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-xl font-semibold text-primary"
          >
            {formatInitials(graduate.fullName)}
          </span>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground md:text-[1.7rem]">
              {graduate.fullName}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {graduate.program} · {graduate.faculty}
            </p>
          </div>
        </div>
        <div className="mt-2 sm:mt-0">
          <GraduateStatusBadge status={graduate.status} showDot />
        </div>
      </div>

      {/* Info cards */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow
              icon={<Hash className="size-3.5" />}
              label="Documento"
              value={`${DOCUMENT_TYPE_LABEL[graduate.documentType]} ${formatDocument(graduate.documentNumber)}`}
            />
            <InfoRow
              icon={<Hash className="size-3.5" />}
              label="Código estudiantil"
              value={graduate.studentCode}
            />
            <InfoRow
              icon={<Mail className="size-3.5" />}
              label="Correo institucional"
              value={graduate.email}
            />
            <InfoRow
              icon={<BookOpen className="size-3.5" />}
              label="Programa"
              value={graduate.program}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ceremonia e invitados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow
              icon={<BookOpen className="size-3.5" />}
              label="Ceremonia"
              value={ceremony?.name ?? graduate.ceremonyId}
            />
            {ceremony && (
              <InfoRow
                icon={<Hash className="size-3.5" />}
                label="Fecha"
                value={formatDateShort(ceremony.date)}
              />
            )}
            <InfoRow
              icon={<Users className="size-3.5" />}
              label="Cupos asignados"
              value={String(graduate.maxGuests)}
            />
            <InfoRow
              icon={<Users className="size-3.5" />}
              label="Cupos usados / con QR"
              value={`${guestsUsed} / ${guestsWithQR}`}
            />
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Guests table */}
      <section>
        <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
          Invitados ({guests.length})
        </h2>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Invitado</TableHead>
                <TableHead className="hidden sm:table-cell">Documento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">
                  Enviado
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.map((g) => (
                <TableRow
                  key={g.id}
                  className={g.status === "revoked" ? "opacity-60" : ""}
                >
                  <TableCell className="pl-4">
                    <p className="font-medium text-foreground">{g.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.email ?? "Sin correo"}{" "}
                      {g.relationship && (
                        <span className="text-muted-foreground/70">
                          · {g.relationship}
                        </span>
                      )}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground tabular-nums sm:table-cell">
                    {g.documentNumber ? formatDocument(g.documentNumber) : "—"}
                  </TableCell>
                  <TableCell>
                    <GuestStatusBadge status={g.status} showDot />
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {g.invitedAt ? formatDateTime(g.invitedAt) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {guests.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Este graduando no ha registrado invitados.
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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-right font-medium text-foreground">{value}</p>
    </div>
  );
}
