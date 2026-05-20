import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

const NAV_LINKS = [
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Para administradores", href: "/#admin" },
  { label: "Soporte", href: "/#soporte" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-8">
        <BrandMark size="md" />
        <nav
          aria-label="Principal"
          className="ml-6 hidden flex-1 items-center gap-1 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href={ROUTES.admin}>Acceder como administrador</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={ROUTES.registro}>Registrar invitados</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
