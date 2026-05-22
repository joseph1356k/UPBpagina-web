import { ReportsPanel } from "@/components/admin/reports-panel";
import { PageHeader } from "@/components/shared/page-header";
import {
  getCeremonies,
  getGraduates,
  getGuestsAdmin,
  getScanEventsAdmin,
} from "@/lib/data";

export const metadata = {
  title: "Reportes — Panel administrador",
};

export default async function ReportsPage() {
  const [ceremonies, graduates, guests, scans] = await Promise.all([
    getCeremonies(),
    getGraduates(),
    getGuestsAdmin(),
    getScanEventsAdmin(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Panel administrador"
        title="Reportes"
        description="Exporta los datos a CSV. Compatible con Excel y Google Sheets — útil para reuniones con la facultad o auditorías externas."
      />

      <ReportsPanel
        ceremonies={ceremonies}
        graduates={graduates}
        guests={guests}
        scans={scans}
      />
    </div>
  );
}
