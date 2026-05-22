"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCw, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UpbShield } from "@/components/shared/upb-shield";

/**
 * Root error boundary — catches errors that bubble past route-level
 * error.tsx files. Last-resort branded fallback.
 */
export default function RootError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[root] error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6">
        <UpbShield className="size-20" />
      </div>
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-6 text-destructive" />
      </div>
      <h1 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
        Algo salió mal
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Tuvimos un problema inesperado. Si vuelve a pasar, contáctanos en{" "}
        <a
          href="mailto:ceremonias@upb.edu.co"
          className="text-primary underline underline-offset-4"
        >
          ceremonias@upb.edu.co
        </a>
        .
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-muted-foreground/70">
          Referencia: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-2">
        <Button onClick={unstable_retry}>
          <RotateCw className="size-4" />
          Reintentar
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="size-4" />
            Ir al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}
