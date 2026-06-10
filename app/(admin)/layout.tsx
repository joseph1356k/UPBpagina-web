import { AdminSidebar, type AdminSidebarUser } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { USE_SUPABASE } from "@/lib/supabase/env";

async function getCurrentStaff(): Promise<AdminSidebarUser | null> {
  if (!USE_SUPABASE) {
    return {
      fullName: "Administrador (mock)",
      role: "admin",
    };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return null;

  return {
    fullName: profile.full_name,
    role: profile.role,
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentStaff();

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
