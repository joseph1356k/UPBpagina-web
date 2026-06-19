import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LiveAttendance } from "@/components/admin/live-attendance";
import { getCeremony, getCeremonyStats } from "@/lib/data";
import { ROUTES } from "@/lib/constants";
import { formatDateLong, formatTime } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ceremony = await getCeremony(id);
  return {
    title: ceremony
      ? `Tablero en vivo — ${ceremony.name}`
      : "Tablero no encontrado",
  };
}

export default async function CeremonyMonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ceremony = await getCeremony(id);
  if (!ceremony) notFound();

  const stats = await getCeremonyStats(id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
        >
          <Link href={`${ROUTES.adminCeremonias}/${ceremony.id}`}>
            <ArrowLeft className="size-3.5" />
            Volver al evento
          </Link>
        </Button>
      </div>

      <div>
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Tablero en vivo
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

      <LiveAttendance
        variant="full"
        ceremonyId={ceremony.id}
        ceremonyName={ceremony.name}
        initial={stats}
      />
    </div>
  );
}
