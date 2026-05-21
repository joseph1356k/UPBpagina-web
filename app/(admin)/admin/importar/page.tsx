import { ImportStepper } from "@/components/admin/import-stepper";
import { PageHeader } from "@/components/shared/page-header";
import { getCeremonies } from "@/lib/mock";

export const metadata = {
  title: "Importar base — Panel administrador",
};

export default async function ImportPage() {
  const ceremonies = await getCeremonies();
  const eligible = ceremonies.filter(
    (c) => c.status === "open" || c.status === "draft",
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Panel administrador"
        title="Importar graduandos"
        description="Carga el listado oficial de Secretaría Académica. Validamos los datos antes de crear los registros para que ningún graduando quede mal cargado."
      />

      <ImportStepper ceremonies={eligible.length > 0 ? eligible : ceremonies} />
    </div>
  );
}
