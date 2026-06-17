"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  Share2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QrCode } from "@/components/shared/qr-code";
import { UpbShield } from "@/components/shared/upb-shield";
import { GuestStatusBadge } from "@/components/shared/status-badge";
import { PRODUCT } from "@/lib/constants";
import { formatDateLong, formatTime } from "@/lib/format";
import { cap, getTerminology } from "@/lib/terminology";
import type { InvitationView as InvitationViewData } from "@/lib/data";
import { cn } from "@/lib/utils";

interface Props {
  view: InvitationViewData;
  token: string;
}

export function InvitationView({ view, token }: Props) {
  const { guest, graduate, ceremony, blocked } = view;
  const [copied, setCopied] = useState(false);
  const terms = getTerminology(ceremony.eventType);

  const blockedCopy: Record<
    NonNullable<InvitationViewData["blocked"]>,
    { title: string; body: string }
  > = {
    revoked: {
      title: "Esta invitación fue revocada",
      body: `El ${terms.participantSingular} o la organización retiró este pase. Si crees que es un error, contacta directamente al ${terms.participantSingular}.`,
    },
    ceremony_completed: {
      title: `${cap(terms.eventNoun)} finalizado`,
      body: `Esta invitación corresponde a un evento que ya se realizó. Gracias por acompañar al ${terms.participantSingular}.`,
    },
  };

  function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator
        .share({
          title: graduate
            ? `Invitación de ${graduate.fullName}`
            : `Mi pase · ${ceremony.name}`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        toast.success("Enlace copiado");
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-8 md:py-12">
      {/* Brand bar */}
      <div className="flex items-center gap-2.5">
        <UpbShield className="size-10 shrink-0" />
        <div>
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {PRODUCT.institution}
          </p>
          <p className="font-serif text-sm font-semibold leading-tight text-foreground">
            {terms.label}
          </p>
        </div>
      </div>

      {/* Greeting */}
      <header className="flex items-start gap-4">
        {/* Optional participant photo */}
        {graduate?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={graduate.photoUrl}
            alt={graduate.fullName}
            className="mt-1 size-14 shrink-0 rounded-full border-2 border-brand-gold/60 object-cover"
          />
        ) : null}
        <div>
          <p className="text-sm text-muted-foreground">
            Hola{" "}
            <span className="font-medium text-foreground">
              {guest.fullName.split(" ")[0]}
            </span>
            ,
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold leading-tight text-foreground md:text-[1.7rem]">
            {graduate
              ? `${graduate.fullName.split(" ").slice(0, 2).join(" ")} ${terms.invitePhrase}.`
              : "Tu pase de ingreso está listo."}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Guarda esta invitación — la necesitarás para ingresar el día del
            evento.
          </p>
        </div>
      </header>

      {/* Status banner (when blocked) */}
      {blocked && (
        <div
          className={cn(
            "flex gap-3 rounded-xl border p-4",
            blocked === "revoked"
              ? "border-destructive/30 bg-destructive/5"
              : "border-warning/30 bg-warning/5",
          )}
        >
          <AlertTriangle
            className={cn(
              "mt-0.5 size-5 shrink-0",
              blocked === "revoked" ? "text-destructive" : "text-warning",
            )}
          />
          <div>
            <p className="font-medium text-foreground">
              {blockedCopy[blocked].title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {blockedCopy[blocked].body}
            </p>
          </div>
        </div>
      )}

      {/* QR card */}
      <article
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm",
          blocked && "opacity-60",
        )}
      >
        <div className="absolute right-4 top-4">
          <GuestStatusBadge status={guest.status} audience="graduate" showDot />
        </div>

        <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Pase de ingreso
        </p>
        <p className="mt-1 font-serif text-lg font-semibold text-foreground">
          {guest.fullName}
        </p>
        {guest.relationship && graduate && (
          <p className="text-xs text-muted-foreground">
            De {graduate.fullName} · {guest.relationship}
          </p>
        )}

        {/* QR */}
        <div className="mt-5 flex justify-center">
          <QrCode value={`${typeof window !== "undefined" ? window.location.origin : ""}/invitacion/${token}`} size={220} />
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Presenta este código en la entrada. Funciona aunque no tengas
          conexión a Internet.
        </p>

        <Separator className="my-5" />

        <div className="grid gap-3 text-sm">
          <Row
            icon={<Calendar className="size-3.5" />}
            label="Fecha"
            value={formatDateLong(ceremony.date)}
          />
          <Row
            icon={<Clock className="size-3.5" />}
            label="Hora"
            value={`${formatTime(ceremony.startTime)} – ${formatTime(ceremony.endTime)}`}
          />
          <Row
            icon={<MapPin className="size-3.5" />}
            label="Lugar"
            value={`${ceremony.venue}, ${ceremony.campus}`}
          />
        </div>
      </article>

      {/* Actions */}
      {!blocked && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleShare}
            className="flex-1"
          >
            {copied ? (
              <>
                <CheckCircle2 className="size-4" />
                Copiado
              </>
            ) : (
              <>
                <Share2 className="size-4" />
                Compartir
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="flex-1"
          >
            <Download className="size-4" />
            Guardar / Imprimir
          </Button>
        </div>
      )}

      {/* Info */}
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <p className="flex items-start gap-1.5">
          <Sparkles className="mt-0.5 size-3 shrink-0 text-primary" />
          <span>
            Si tienes alguna duda, escribe a{" "}
            <a
              href="mailto:ceremonias@upb.edu.co"
              className="text-foreground underline underline-offset-2 hover:text-primary"
            >
              ceremonias@upb.edu.co
            </a>
            .
          </span>
        </p>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
