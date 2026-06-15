import { EventTypesManager } from "@/components/admin/event-types-manager";
import { PageHeader } from "@/components/shared/page-header";
import { getEventTypes } from "@/lib/data";

export const metadata = {
  title: "Tipos de evento — Panel administrador",
};

export default async function EventTypesPage() {
  const types = await getEventTypes();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Panel administrador"
        title="Tipos de evento"
        description="Define cómo habla la plataforma para cada tipo de evento: participantes, invitados, plantilla de correo por defecto y campos propios. Puedes editar los tipos base o crear nuevos."
      />

      <EventTypesManager initialTypes={types} />
    </div>
  );
}
