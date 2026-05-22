"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PortalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[portal] error boundary caught:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-7 text-destructive" />
      </div>
      <h1 className="font-serif text-xl font-semibold text-foreground">
        Algo salió mal en tu portal
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Intenta de nuevo. Si el problema persiste, escríbenos a{" "}
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
          ID: {error.digest}
        </p>
      )}
      <Button onClick={unstable_retry} className="mt-6">
        <RotateCw className="size-4" />
        Reintentar
      </Button>
    </div>
  );
}
