import { AuditLogTable } from "@/components/admin/audit-log-table";
import { PageHeader } from "@/components/shared/page-header";
import { getAuditLogAdmin } from "@/lib/data";

export const metadata = {
  title: "Auditoría — Panel administrador",
};

export default async function AuditPage() {
  const entries = await getAuditLogAdmin();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Panel administrador"
        title="Auditoría"
        description="Trazabilidad completa de cambios administrativos: quién creó, quién editó, quién revocó, y cuándo."
      />

      <AuditLogTable entries={entries} />
    </div>
  );
}
