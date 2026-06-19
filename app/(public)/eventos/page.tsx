import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin } from "lucide-react";

import { Card } from "@/components/ui/card";
import { getPublicEvents } from "@/lib/data";
import { ROUTES } from "@/lib/constants";
import { formatDateLong, formatTime } from "@/lib/format";
import { cap, getTerminology } from "@/lib/terminology";

export const metadata = {
  title: "Eventos abiertos — UPB",
  description:
    "Explora los eventos abiertos de la Universidad Pontificia Bolivariana y regístrate para recibir tu pase.",
};

export default async function EventosPage() {
  const events = await getPublicEvents();

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16 md:px-8 md:py-20">
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-primary">
          Eventos abiertos
        </p>
        <h1 className="text-balance font-serif text-3xl font-semibold tracking-tight md:text-[2.4rem]">
          Encuentra tu próximo evento en la UPB
        </h1>
        <p className="mt-4 text-pretty text-muted-foreground">
          Estos eventos están abiertos al público. Regístrate y recibirás tu
          pase con código QR en el correo.
        </p>
      </header>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <CalendarDays className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-3 font-medium text-foreground">
            No hay eventos abiertos por ahora
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Vuelve pronto: publicamos los eventos a medida que se abren.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {events.map((e) => {
            const term = getTerminology(e.eventType);
            return (
              <li key={e.id}>
                <Link href={`${ROUTES.eventos}/${e.id}`} className="group block h-full">
                  <Card className="card-lift flex h-full flex-col gap-4 p-5 ring-foreground/8">
                    <div>
                      <p className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-primary">
                        {cap(term.eventNoun)}
                      </p>
                      <h2 className="mt-1.5 font-serif text-lg font-semibold leading-tight text-foreground">
                        {e.name}
                      </h2>
                    </div>
                    <dl className="mt-auto space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-3.5 shrink-0 text-primary" />
                        {formatDateLong(e.date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 shrink-0 text-primary" />
                        {formatTime(e.startTime)} – {formatTime(e.endTime)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 shrink-0 text-primary" />
                        {e.venue}, {e.campus}
                      </div>
                    </dl>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      Ver y registrarme
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
