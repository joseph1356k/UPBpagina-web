"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/shared/brand-mark";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, type AdminNavItem } from "./nav-items";

interface AdminSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-4">
        <BrandMark size="md" href="/admin" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((group, idx) => (
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
      <UserChip />
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

function UserChip() {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div
        aria-hidden
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary text-xs font-semibold ring-1 ring-primary/15"
      >
        MG
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          María González
        </p>
        <p className="truncate text-xs text-muted-foreground">
          Administrador · UPB Medellín
        </p>
      </div>
    </div>
  );
}
