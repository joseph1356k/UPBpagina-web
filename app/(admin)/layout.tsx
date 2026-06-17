import { AdminSidebar, type AdminSidebarUser } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { getCurrentStaff } from "@/lib/security/staff-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getCurrentStaff();
  const user: AdminSidebarUser | null = staff
    ? { fullName: staff.fullName, role: staff.role }
    : null;

  return (
    <div className="flex flex-1 min-h-0">
      <AdminSidebar
        className="hidden border-r border-sidebar-border md:flex"
        user={user}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar user={user} />
        <main id="main-content" className="flex-1 overflow-y-auto bg-brand-surface/30 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
