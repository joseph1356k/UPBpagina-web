"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Admin error boundary — Next.js 16 API.
 * Receives `unstable_retry` (formerly `reset`).
 */
export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // TODO: replace with Sentry/Pino when wired
    console.error("[admin] error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-7 text-destructive" />
      </div>
      <h1 className="font-serif text-2xl font-semibold text-foreground">
        Algo salió mal
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        No pudimos cargar esta sección. El equipo técnico ya fue notificado.
        Puedes reintentar o volver al panel principal.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-muted-foreground/70">
          ID: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-2">
        <Button onClick={unstable_retry} variant="default">
          <RotateCw className="size-4" />
          Reintentar
        </Button>
        <Button asChild variant="outline">
          <a href="/admin">Ir al panel</a>
        </Button>
      </div>
    </div>
  );
}
