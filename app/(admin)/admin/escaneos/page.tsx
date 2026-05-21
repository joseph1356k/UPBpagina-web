import { CheckCircle2, ScanLine, XCircle } from "lucide-react";

import { ScanEventsTable } from "@/components/admin/scan-events-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { getCeremonies, getScanEventsAdmin } from "@/lib/mock";
import { formatNumber } from "@/lib/format";

export const metadata = {
  title: "Escaneos — Panel administrador",
};

export default async function ScanEventsPage() {
  const [events, ceremonies] = await Promise.all([
    getScanEventsAdmin(),
    getCeremonies(),
  ]);

  const allowed = events.filter((e) => e.result === "allowed").length;
  const denied = events.filter((e) => e.result === "denied").length;
  // Events from the most recent day of activity in the data (not "now",
  // which would be impure during render).
  const latestDay = events[0]?.scannedAt.slice(0, 10);
  const recentDay = latestDay
    ? events.filter((e) => e.scannedAt.startsWith(latestDay)).length
    : 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Panel administrador"
        title="Log de escaneos"
        description="Cada validación de QR queda registrada con operador, resultado y motivo. Útil para auditar el día del evento."
      />

      <section
        aria-label="Resumen de escaneos"
        className="grid gap-3 sm:grid-cols-3"
      >
        <StatCard
          label="Ingresos permitidos"
          value={formatNumber(allowed)}
          hint="Total histórico"
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          label="Rechazados"
          value={formatNumber(denied)}
          hint="QR ya usado, revocado, etc."
          icon={XCircle}
          accent="warning"
        />
        <StatCard
          label="Último día activo"
          value={formatNumber(recentDay)}
          hint="Escaneos del día más reciente"
          icon={ScanLine}
          accent="info"
        />
      </section>

      <ScanEventsTable events={events} ceremonies={ceremonies} />
    </div>
  );
}
