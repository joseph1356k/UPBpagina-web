import Link from "next/link";
import { MoveLeft } from "lucide-react";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <BrandMark size="lg" variant="mark-only" href={null} />
        <p className="mt-6 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-primary">
          Error 404
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
          Esta página no existe.
        </h1>
        <p className="mt-4 max-w-sm text-pretty text-muted-foreground">
          La dirección que ingresaste no corresponde a ninguna sección de la
          plataforma. Es posible que el enlace haya cambiado o se haya escrito
          mal.
        </p>
        <Button asChild className="mt-9">
          <Link href="/">
            <MoveLeft className="size-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </main>
  );
}
