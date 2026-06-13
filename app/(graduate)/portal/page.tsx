"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  GraduationCap,
  MapPin,
  Send,
  UserPlus2,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GuestForm } from "@/components/graduate/guest-form";
import { GuestStatusBadge } from "@/components/shared/status-badge";
import { PhotoCard } from "@/components/graduate/photo-card";
import { QuotaCard } from "@/components/graduate/quota-card";
import { SendInvitationsDialog } from "@/components/graduate/send-invitations-dialog";
import { useGraduatePortal } from "@/components/graduate/auth-provider";
import { ROUTES } from "@/lib/constants";
import { formatDateLong, formatInitials, formatTime } from "@/lib/format";
import { getTerminology } from "@/lib/terminology";
import { cn } from "@/lib/utils";

const RECENT_PREVIEW_COUNT = 4;

export default function PortalDashboard() {
  const { graduate, ceremony, guests, isFull, quotaUsed, quotaTotal } =
    useGraduatePortal();
  const terms = getTerminology(ceremony.eventType);

  const [guestFormOpen, setGuestFormOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const sortedGuests = [...guests].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const recent = sortedGuests.slice(0, RECENT_PREVIEW_COUNT);
  const pendingCount = guests.filter((g) => g.status === "pending").length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:py-10">

      {/* ── Welcome ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Bienvenido,</p>
        <h1 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
          {graduate.fullName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {graduate.program} · {graduate.faculty}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* ── Ceremony card ───────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm md:col-span-2">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {ceremony.eventType === "graduation"
                  ? "Tu ceremonia de grado"
                  : `Tu ${terms.eventNoun} · ${terms.label}`}
              </p>
              <h2 className="mt-0.5 font-semibold text-foreground">
                {ceremony.name}
              </h2>
              <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5 shrink-0" />
                  {formatDateLong(ceremony.date)} · {formatTime(ceremony.startTime)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  {ceremony.venue}, {ceremony.campus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Participant photo (only where it adds value) ─────────── */}
        {terms.photoRecommended && (
          <div className="md:col-span-2">
            <PhotoCard />
          </div>
        )}

        {/* ── Quota card ──────────────────────────────────────────── */}
        <QuotaCard />

        {/* ── Send invitations CTA ────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-start gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Send className="size-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Listos para enviar</h3>
              <p className="text-xs text-muted-foreground">
                Invitados en borrador que pueden enviarse ahora.
              </p>
            </div>
          </div>
          <p className="mb-3 font-serif text-2xl font-semibold text-foreground tabular-nums">
            {pendingCount}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {pendingCount === 1 ? "invitado" : "invitados"}
            </span>
          </p>
          <Button
            className="w-full"
            disabled={pendingCount === 0}
            onClick={() => setSendOpen(true)}
          >
            <Send className="size-4" />
            Enviar invitaciones
          </Button>
        </div>
      </div>

      {/* ── Recent guests preview ─────────────────────────────────── */}
      <div className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Mis invitados
            </h2>
            <p className="text-sm text-muted-foreground">
              {quotaUsed === 0
                ? "Aún no has agregado invitados."
                : `${quotaUsed} de ${quotaTotal} cupos en uso.`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGuestFormOpen(true)}
            disabled={isFull}
            className="text-primary hover:text-primary"
          >
            <UserPlus2 className="size-3.5" />
            Agregar
          </Button>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Tu lista está vacía
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Agrega a tus familiares y amigos. Quedarán como borrador hasta
                que envíes las invitaciones.
              </p>
            </div>
            <Button onClick={() => setGuestFormOpen(true)} disabled={isFull}>
              <UserPlus2 className="size-4" />
              Agregar primer invitado
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((g) => (
              <li
                key={g.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5",
                  g.status === "revoked" && "opacity-60",
                )}
              >
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                >
                  {formatInitials(g.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {g.fullName}
                  </p>
                  {g.relationship && (
                    <p className="text-xs text-muted-foreground">
                      {g.relationship}
                    </p>
                  )}
                </div>
                <GuestStatusBadge
                  status={g.status}
                  audience="graduate"
                  showDot
                />
              </li>
            ))}
          </ul>
        )}

        {guests.length > 0 && (
          <Button
            asChild
            variant="outline"
            className="mt-3 w-full sm:w-auto"
          >
            <Link href={ROUTES.portalInvitados}>
              Gestionar todos los invitados
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>

      {/* ── Footer help block ─────────────────────────────────────── */}
      <div className="mt-10 rounded-xl border border-border bg-card/40 px-5 py-4">
        <p className="font-medium text-foreground">¿Necesitas más cupos?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Las solicitudes excepcionales se gestionan con tu facultad. Escríbenos
          a{" "}
          <a
            href="mailto:secretaria.academica@upb.edu.co"
            className="underline underline-offset-4 hover:text-foreground"
          >
            secretaria.academica@upb.edu.co
          </a>
          .
        </p>
        <Button
          asChild
          variant="link"
          size="sm"
          className="mt-1 -ml-2.5 text-muted-foreground hover:text-foreground"
        >
          <Link href={ROUTES.portalInvitados}>
            Ver todos los invitados
            <ChevronRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      {/* ── Overlays ──────────────────────────────────────────────── */}
      <GuestForm open={guestFormOpen} onOpenChange={setGuestFormOpen} />
      <SendInvitationsDialog open={sendOpen} onOpenChange={setSendOpen} />
    </div>
  );
}
