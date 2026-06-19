"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";
import { ADMIN_NAV, type AdminNavItem } from "./nav-items";

export interface AdminSidebarUser {
  fullName: string;
  role: string;
  campus?: string;
}

interface AdminSidebarProps {
  className?: string;
  onNavigate?: () => void;
  user?: AdminSidebarUser | null;
}

export function AdminSidebar({ className, onNavigate, user }: AdminSidebarProps) {
  const role = user?.role;
  // Scope the nav: items with a `roles` list are only shown to those roles
  // (e.g. organizers don't see Usuarios / Configuración / Importar).
  const navGroups = ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        !item.roles || (role != null && item.roles.includes(role as UserRole)),
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      {/* Gold accent line — UPB institutional touch */}
      <div
        aria-hidden
        className="h-0.5 shrink-0 bg-gradient-to-r from-primary via-brand-gold to-primary"
      />
      <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-4">
        <BrandMark size="md" href="/admin" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group, idx) => (
          <div key={group.label} className={cn(idx > 0 && "mt-5")}>
            <p className="px-3 pb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={onNavigate} />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />
      <UserChip user={user} />
    </aside>
  );
}

function NavLink({
  item,
  onNavigate,
}: {
  item: AdminNavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group/nav relative flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[0.88rem] font-medium transition-all",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        <item.icon className="size-4 shrink-0" />
        <span className="truncate">{item.label}</span>
        {item.comingSoon ? (
          <span
            className={cn(
              "ml-auto rounded-full px-1.5 py-0.5 text-[0.6rem] font-medium tracking-wide uppercase",
              isActive
                ? "bg-white/15 text-sidebar-primary-foreground/90"
                : "bg-muted text-muted-foreground/80",
            )}
          >
            Pronto
          </span>
        ) : null}
      </Link>
    </li>
  );
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  coordinator: "Coordinador",
  scanner: "Operador de escáner",
  organizer: "Organizador",
};

function UserChip({ user }: { user?: AdminSidebarUser | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const fullName = user?.fullName ?? "Usuario";
  const roleLabel = user ? (ROLE_LABEL[user.role] ?? user.role) : "Cargando…";
  const subtitle = user?.campus ? `${roleLabel} · ${user.campus}` : roleLabel;
  const initials = formatInitials(fullName);

  function handleSignOut() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/staff/sign-out", {
          method: "POST",
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error("signout_failed");
        // Hard navigate so cookies are re-read on the next request
        router.replace("/admin/iniciar-sesion");
        router.refresh();
      } catch {
        toast.error("No se pudo cerrar sesión. Intenta de nuevo.");
      }
    });
  }

  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div
        aria-hidden
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary text-xs font-semibold ring-1 ring-primary/15"
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {fullName}
        </p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        onClick={handleSignOut}
        disabled={isPending}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
