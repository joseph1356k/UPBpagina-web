import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RsvpForm } from "@/components/public/rsvp-form";
import { getCeremony } from "@/lib/data";
import { ROUTES } from "@/lib/constants";
import { formatDateLong, formatNumber, formatTime } from "@/lib/format";
import { cap, getTerminology } from "@/lib/terminology";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getCeremony(id);
  return {
    title:
      event && event.publicListed
        ? `${event.name} — UPB`
        : "Evento no encontrado",
  };
}

export default async function EventoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getCeremony(id);
  // Only publicly-listed events are reachable here.
  if (!event || !event.publicListed) notFound();

  const term = getTerminology(event.eventType);
  const open = event.status === "open";

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8 md:py-16">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 mb-6 text-muted-foreground"
      >
        <Link href={ROUTES.eventos}>
          <ArrowLeft className="size-3.5" />
          Todos los eventos
        </Link>
      </Button>

      <p className="text-[0.72rem] font-medium uppercase tracking-[0.2em] text-primary">
        {cap(term.eventNoun)}
      </p>
      <h1 className="mt-1.5 text-balance font-serif text-3xl font-semibold tracking-tight md:text-[2.2rem]">
        {event.name}
      </h1>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <Detail icon={CalendarDays} label="Fecha">
          {formatDateLong(event.date)}
        </Detail>
        <Detail icon={Clock} label="Horario">
          {formatTime(event.startTime)} – {formatTime(event.endTime)}
        </Detail>
        <Detail icon={MapPin} label="Lugar">
          {event.venue}, {event.campus}
        </Detail>
        {event.capacity != null && (
          <Detail icon={Users} label="Aforo">
            {formatNumber(event.capacity)} {term.guestPlural}
          </Detail>
        )}
      </dl>

      {/* Registration — the RSVP form (A3) mounts here. */}
      <Card className="mt-8" id="registro">
        <CardHeader>
          <CardTitle className="text-base">Regístrate para asistir</CardTitle>
        </CardHeader>
        <CardContent>
          {open ? (
            <RsvpForm ceremonyId={event.id} />
          ) : (
            <p className="text-sm text-muted-foreground">
              El registro para este evento está cerrado.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-4 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <dt className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </dt>
        <dd className="text-sm font-medium text-foreground">{children}</dd>
      </div>
    </div>
  );
}
