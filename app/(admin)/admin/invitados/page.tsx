import { GuestsAdminTable } from "@/components/admin/guests-admin-table";
import { PageHeader } from "@/components/shared/page-header";
import { getCeremonies, getGuestsAdmin } from "@/lib/data";

export const metadata = {
  title: "Invitados — Panel administrador",
};

export default async function InvitadosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { ceremony } = await searchParams;
  const ceremonyId = typeof ceremony === "string" ? ceremony : undefined;

  const [guests, ceremonies] = await Promise.all([
    getGuestsAdmin(ceremonyId ? { ceremonyId } : {}),
    getCeremonies(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Panel administrador"
        title="Invitados"
        description="Consulta todos los invitados registrados, su estado de invitación y su historial de ingreso."
      />

      <GuestsAdminTable
        initialGuests={guests}
        ceremonies={ceremonies}
        initialCeremonyId={ceremonyId ?? ""}
      />
    </div>
  );
}
