import { CeremoniesTable } from "@/components/admin/ceremonies-table";
import { PageHeader } from "@/components/shared/page-header";
import { getCeremonies } from "@/lib/mock";

export const metadata = {
  title: "Ceremonias — Panel administrador",
};

export default async function CeremoniesPage() {
  const ceremonies = await getCeremonies();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Panel administrador"
        title="Ceremonias"
        description="Gestiona las ceremonias de grado: crea, edita y controla el estado de cada evento."
      />

      <CeremoniesTable initialCeremonies={ceremonies} />
    </div>
  );
}
