import Link from "next/link";
import { ScanLine } from "lucide-react";

import { ROUTES } from "@/lib/constants";

export const metadata = {
  title: "Escáner de ingreso",
};

const FEATURES = [
  "Login simple con PIN o magic link de scanner",
  "Selector de ceremonia activa",
  "Lectura de cámara con feedback inmediato",
  "Resultado claro: ingreso permitido o motivo de rechazo",
  "Historial del operador y log global en el panel admin",
  "Modo offline con sync diferido (V2)",
];

export default function ScannerPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <span
          aria-hidden
          className="mb-6 inline-flex size-14 items-center justify-center rounded-full bg-white/8 ring-1 ring-white/15"
        >
          <ScanLine className="size-6 text-background/90" />
        </span>
        <p className="mb-2 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-background/60">
          Sección 6 · En construcción
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-background md:text-[2.1rem]">
          Escáner de ingreso
        </h1>
        <p className="mt-4 max-w-sm text-pretty text-background/75">
          App tipo PWA para que el personal de logística valide los QR de los
          invitados el día del evento, desde cualquier celular.
        </p>
        <div className="mt-8 w-full rounded-lg border border-white/12 bg-white/5 p-5 text-left">
          <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-background/55">
            Lo que incluirá
          </p>
          <ul className="space-y-1.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-2 text-sm leading-relaxed text-background/85">
                <span
                  aria-hidden
                  className="mt-1 size-1 shrink-0 rounded-full bg-background/60"
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link
          href={ROUTES.home}
          className="mt-10 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-white/12"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
