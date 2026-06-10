"use client";

import { Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AdminSidebar,
  type AdminSidebarUser,
} from "@/components/admin/admin-sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AdminTopbarProps {
  className?: string;
  user?: AdminSidebarUser | null;
}

export function AdminTopbar({ className, user }: AdminTopbarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/admin/graduandos?q=${encodeURIComponent(q)}`);
    setQuery("");
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-6",
        className,
      )}
    >
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Abrir menú"
            />
          }
        >
          <Menu className="size-4" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <AdminSidebar onNavigate={() => setMobileOpen(false)} user={user} />
        </SheetContent>
      </Sheet>

      <form
        onSubmit={handleSearch}
        className="relative hidden flex-1 max-w-md md:block"
        role="search"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar graduandos por nombre, documento o correo…"
          aria-label="Buscar graduandos"
          className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-9 pr-12 text-sm text-foreground transition-colors placeholder:text-muted-foreground hover:bg-muted/60 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[0.62rem] font-medium text-muted-foreground lg:inline-block">
          Enter
        </kbd>
      </form>

      <div className="md:hidden flex-1" />

      <div className="flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
