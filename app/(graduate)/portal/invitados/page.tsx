"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Send,
  UserPlus2,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GuestForm } from "@/components/graduate/guest-form";
import { GuestRow } from "@/components/graduate/guest-row";
import { InvitationPreview } from "@/components/graduate/invitation-preview";
import { QuotaCard } from "@/components/graduate/quota-card";
import { SendInvitationsDialog } from "@/components/graduate/send-invitations-dialog";
import { useGraduatePortal } from "@/components/graduate/auth-provider";
import { ROUTES } from "@/lib/constants";
import { pluralize } from "@/lib/format";
import type { Guest, GuestStatus } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Grouping                                                          */
/* ------------------------------------------------------------------ */

interface Group {
  status: GuestStatus;
  label: string;
  description: string;
}

const GROUPS: Group[] = [
  {
    status: "pending",
    label: "Borradores",
    description: "Listos para enviar.",
  },
  {
    status: "invited",
    label: "Invitaciones enviadas",
    description: "Recibieron su pase y están confirmados.",
  },
  {
    status: "checked_in",
    label: "Asistieron a la ceremonia",
    description: "Ingresaron el día del evento.",
  },
  {
    status: "revoked",
    label: "Revocadas",
    description: "Ya no participan.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function GuestsManagementPage() {
  const { graduate, ceremony, guests, isFull } = useGraduatePortal();

  const [guestFormOpen, setGuestFormOpen] = useState(false);
  const [guestBeingEdited, setGuestBeingEdited] = useState<Guest | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const pendingCount = guests.filter((g) => g.status === "pending").length;

  const previewGuest =
    guests.find((g) => g.status === "pending") ??
    guests[0] ??
    null;

  function openCreate() {
    setGuestBeingEdited(null);
    setGuestFormOpen(true);
  }

  function openEdit(guest: Guest) {
    setGuestBeingEdited(guest);
    setGuestFormOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">

      {/* ── Breadcrumb / back link ─────────────────────────────────── */}
      <Link
        href={ROUTES.portal}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Volver al portal
      </Link>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
          Mis invitados
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registra a tus invitados y envíales el pase de ingreso digital cuando
          tengas todo listo.
        </p>
      </div>

      {/* ── Quota + actions ────────────────────────────────────────── */}
      <div className="mb-6">
        <QuotaCard className="mb-4" />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button onClick={openCreate} disabled={isFull} className="sm:flex-1">
            <UserPlus2 className="size-4" />
            Agregar invitado
          </Button>
          <Button
            variant="outline"
            onClick={() => setPreviewOpen(true)}
            disabled={!previewGuest}
            className="sm:flex-1"
          >
            <Eye className="size-4" />
            Ver vista previa
          </Button>
          <Button
            variant="default"
            onClick={() => setSendOpen(true)}
            disabled={pendingCount === 0}
            className="sm:flex-1"
          >
            <Send className="size-4" />
            Enviar invitaciones
            {pendingCount > 0 && (
              <span className="ml-1 rounded bg-primary-foreground/20 px-1.5 py-0.5 text-xs tabular-nums">
                {pendingCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ── Guest groups ───────────────────────────────────────────── */}
      {guests.length === 0 ? (
        <EmptyState onAdd={openCreate} isFull={isFull} />
      ) : (
        <div className="space-y-7">
          {GROUPS.map((group) => {
            const groupGuests = guests
              .filter((g) => g.status === group.status)
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
            if (groupGuests.length === 0) return null;

            return (
              <section key={group.status}>
                <header className="mb-2 flex items-baseline justify-between gap-2">
                  <h2 className="font-serif text-base font-semibold text-foreground">
                    {group.label}
                    <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
                      ({groupGuests.length})
                    </span>
                  </h2>
                  <p className="hidden text-xs text-muted-foreground sm:block">
                    {group.description}
                  </p>
                </header>
                <div className="space-y-2">
                  {groupGuests.map((g) => (
                    <GuestRow key={g.id} guest={g} onEdit={openEdit} />
                  ))}
                </div>
              </section>
            );
          })}

          {pendingCount > 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
              <p className="font-medium text-foreground">
                Tienes {pluralize(pendingCount, "invitado", "invitados")} en
                borrador
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cuando termines de revisar, envía las invitaciones para que
                reciban su pase de ingreso.
              </p>
              <Button onClick={() => setSendOpen(true)} className="mt-3">
                <Send className="size-4" />
                Enviar invitaciones
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Overlays ───────────────────────────────────────────────── */}
      <GuestForm
        open={guestFormOpen}
        onOpenChange={setGuestFormOpen}
        guest={guestBeingEdited}
      />
      <SendInvitationsDialog open={sendOpen} onOpenChange={setSendOpen} />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-xl p-0">
          <DialogHeader className="px-5 py-3">
            <DialogTitle>Vista previa de la invitación</DialogTitle>
            <DialogDescription>
              Este es el correo que recibirán tus invitados.
            </DialogDescription>
          </DialogHeader>
          {previewGuest && (
            <div className="max-h-[70vh] overflow-y-auto px-5 pb-5">
              <InvitationPreview
                graduate={graduate}
                ceremony={ceremony}
                guest={previewGuest}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                       */
/* ------------------------------------------------------------------ */

function EmptyState({
  onAdd,
  isFull,
}: {
  onAdd: () => void;
  isFull: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Users className="size-5 text-primary" />
      </div>
      <div>
        <p className="font-medium text-foreground">
          Aún no tienes invitados
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Empieza por agregar a tus familiares o amigos más cercanos. Podrás
          editarlos antes de enviar las invitaciones.
        </p>
      </div>
      <Button onClick={onAdd} disabled={isFull}>
        <UserPlus2 className="size-4" />
        Agregar primer invitado
      </Button>
    </div>
  );
}
