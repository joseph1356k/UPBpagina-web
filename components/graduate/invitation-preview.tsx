"use client";

import { GraduationCap, Calendar, MapPin, QrCode } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateLong, formatTime } from "@/lib/format";
import type { Ceremony, Graduate, Guest } from "@/lib/types";

interface InvitationPreviewProps {
  graduate: Graduate;
  ceremony: Ceremony;
  guest: Guest;
  className?: string;
}

/**
 * Read-only preview of what the guest will receive in their inbox.
 * Styled to look like an email card so it's clear this is an email,
 * not the in-app entrance pass (that comes from the public /invitacion
 * route in Section 5).
 */
export function InvitationPreview({
  graduate,
  ceremony,
  guest,
  className,
}: InvitationPreviewProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-white shadow-sm",
        className,
      )}
    >
      {/* Email header */}
      <div className="border-b border-border bg-muted/30 px-5 py-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">De:</span>{" "}
          ceremonias@upb.edu.co
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Para:</span>{" "}
          {guest.email ?? "(sin correo registrado)"}
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          Asunto: Tu invitación a la ceremonia de grado de {graduate.fullName.split(" ")[0]}
        </p>
      </div>

      {/* Email body */}
      <div className="px-6 py-7 text-foreground">
        {/* Brand bar */}
        <div className="mb-5 flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
              Universidad Pontificia Bolivariana
            </p>
            <p className="font-serif text-sm font-semibold leading-none">
              Ceremonia de grado
            </p>
          </div>
        </div>

        <h2 className="font-serif text-xl font-semibold leading-tight">
          Hola {guest.fullName.split(" ")[0]},
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">{graduate.fullName}</span>{" "}
          te ha invitado a acompañarle en su ceremonia de grado. Te esperamos en
          un día único — guarda esta invitación, la necesitarás para ingresar.
        </p>

        {/* Ceremony info */}
        <div className="mt-5 space-y-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3.5 text-sm">
          <p className="font-medium text-foreground">{ceremony.name}</p>
          <div className="space-y-1.5 text-muted-foreground">
            <p className="inline-flex items-center gap-2">
              <Calendar className="size-3.5 shrink-0" />
              {formatDateLong(ceremony.date)} · {formatTime(ceremony.startTime)}
            </p>
            <p className="inline-flex items-center gap-2">
              <MapPin className="size-3.5 shrink-0" />
              {ceremony.venue}, {ceremony.campus}
            </p>
          </div>
        </div>

        {/* QR mock */}
        <div className="mt-5 flex items-center gap-4 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4">
          <div
            aria-hidden
            className="flex size-16 shrink-0 items-center justify-center rounded-md border border-border bg-white"
          >
            <QrCode className="size-9 text-foreground/80" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">Tu pase de ingreso</p>
            <p className="text-xs text-muted-foreground">
              Presenta este código QR el día de la ceremonia. Funciona incluso
              sin conexión a Internet.
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Si tienes preguntas, escríbenos a{" "}
          <span className="text-foreground underline underline-offset-2">
            ceremonias@upb.edu.co
          </span>
          .
        </p>

        <p className="mt-4 text-[0.7rem] text-muted-foreground/70">
          Universidad Pontificia Bolivariana · Circular 1 #70-01, Medellín
        </p>
      </div>
    </div>
  );
}
