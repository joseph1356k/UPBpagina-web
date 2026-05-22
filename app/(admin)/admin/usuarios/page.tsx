import { UsersTable } from "@/components/admin/users-table";
import { PageHeader } from "@/components/shared/page-header";
import { getUsers } from "@/lib/data";

export const metadata = {
  title: "Usuarios — Panel administrador",
};

export default async function UsuariosPage() {
  const users = await getUsers();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Panel administrador"
        title="Usuarios del sistema"
        description="Gestiona las cuentas de administradores, coordinadores y personal de escaneo."
      />

      <UsersTable initialUsers={users} />
    </div>
  );
}
