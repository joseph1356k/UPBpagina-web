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
  const { ceremony, q } = await searchParams;
  const ceremonyId = typeof ceremony === "string" ? ceremony : undefined;
  const initialSearch = typeof q === "string" ? q : "";

  const [graduates, ceremonies] = await Promise.all([
    getGraduates(ceremonyId ? { ceremonyId } : {}),
    getCeremonies(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Panel administrador"
        title="Participantes"
        description="Consulta y gestiona a las personas inscritas en cada evento — graduandos, anfitriones, organizadores o expositores según el tipo."
      />

      <GraduatesTable
        initialGraduates={graduates}
        ceremonies={ceremonies}
        initialCeremonyId={ceremonyId ?? ""}
        initialSearch={initialSearch}
      />
    </div>
  );
}
