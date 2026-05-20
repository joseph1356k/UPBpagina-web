import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
import { PRODUCT } from "@/lib/constants";

const COLUMNS = [
  {
    title: "Producto",
    links: [
      { label: "Cómo funciona", href: "/#como-funciona" },
      { label: "Para graduandos", href: "/registro" },
      { label: "Para administradores", href: "/admin" },
    ],
  },
  {
    title: "Soporte",
    links: [
      { label: "Centro de ayuda", href: "/#soporte" },
      { label: "Contacto coordinación", href: "mailto:ceremonias@upb.edu.co" },
      { label: "Estado del sistema", href: "/#estado" },
    ],
  },
  {
    title: "Institucional",
    links: [
      { label: "UPB Medellín", href: "https://www.upb.edu.co", external: true },
      { label: "Política de datos", href: "/#datos" },
      { label: "Términos de uso", href: "/#terminos" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-brand-surface/60">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <BrandMark size="md" href={null} />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Plataforma institucional para la gestión de invitados en
              ceremonias de grado. Construida con criterios de seguridad,
              trazabilidad y respeto por los datos personales (Ley 1581 de
              2012).
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <h3 className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-foreground">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/70 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} {PRODUCT.institution}. Todos los
            derechos reservados.
          </p>
          <p className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block size-1.5 rounded-full bg-success"
            />
            Sistema operativo · v0.1.0
          </p>
        </div>
      </div>
    </footer>
  );
}
