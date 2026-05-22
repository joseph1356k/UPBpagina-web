import { GraduatesTable } from "@/components/admin/graduates-table";
import { PageHeader } from "@/components/shared/page-header";
import { getCeremonies, getGraduates } from "@/lib/data";

export const metadata = {
  title: "Graduandos — Panel administrador",
};

export default async function GraduandosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { ceremony } = await searchParams;
  const ceremonyId = typeof ceremony === "string" ? ceremony : undefined;

  const [graduates, ceremonies] = await Promise.all([
    getGraduates(ceremonyId ? { ceremonyId } : {}),
    getCeremonies(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Panel administrador"
        title="Graduandos"
        description="Consulta y gestiona el estado de los graduandos inscritos en cada ceremonia."
      />

      <GraduatesTable
        initialGraduates={graduates}
        ceremonies={ceremonies}
        initialCeremonyId={ceremonyId ?? ""}
      />
    </div>
  );
}
