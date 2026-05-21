import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export default function InvitationNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Search className="size-6" />
      </div>
      <h1 className="font-serif text-2xl font-semibold text-foreground">
        Invitación no encontrada
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        El enlace no corresponde a ninguna invitación activa. Verifica que
        copiaste el enlace completo o pídele al graduando que te vuelva a
        compartir su invitación.
      </p>
      <Button asChild variant="outline" className="mt-2">
        <Link href={ROUTES.home}>Volver al inicio</Link>
      </Button>
    </div>
  );
}
