import { CeremoniesTable } from "@/components/admin/ceremonies-table";
import { PageHeader } from "@/components/shared/page-header";
import { getCeremonies, getEventTypes } from "@/lib/data";

export const metadata = {
  title: "Eventos — Panel administrador",
};

export default async function CeremoniesPage() {
  const [ceremonies, eventTypes] = await Promise.all([
    getCeremonies(),
    getEventTypes({ activeOnly: true }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Panel administrador"
        title="Eventos"
        description="Crea, configura y opera eventos de cualquier tipo: grados, conferencias, eventos institucionales, deportivos y más."
      />

      <CeremoniesTable initialCeremonies={ceremonies} eventTypes={eventTypes} />
    </div>
  );
}
