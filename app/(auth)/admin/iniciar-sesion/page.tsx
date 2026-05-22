import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { UpbShield } from "@/components/shared/upb-shield";
import { Button } from "@/components/ui/button";
import { PRODUCT } from "@/lib/constants";

import { StaffLoginForm } from "./login-form";

export const metadata = {
  title: "Iniciar sesión — Panel administrador",
  robots: { index: false, follow: false },
};

export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const redirectTo =
    typeof redirect === "string" && redirect.startsWith("/") ? redirect : "/admin";

  return (
    <div className="w-full max-w-md">
      {/* Back link */}
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2 text-muted-foreground"
      >
        <Link href="/">
          <ArrowLeft className="size-3.5" />
          Volver al inicio
        </Link>
      </Button>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card px-6 py-8 shadow-sm md:px-8 md:py-10">
        {/* Brand */}
        <div className="mb-7 flex items-center gap-3">
          <UpbShield className="size-12 shrink-0" />
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {PRODUCT.institution}
            </p>
            <h1 className="font-serif text-xl font-semibold leading-tight text-foreground">
              Panel administrador
            </h1>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Inicia sesión
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Solo para personal autorizado de UPB. Usa tu correo institucional.
          </p>
        </div>

        <StaffLoginForm redirectTo={redirectTo} />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        ¿Eres graduando?{" "}
        <Link
          href="/registro"
          className="text-primary underline underline-offset-4 hover:no-underline"
        >
          Registra tus invitados aquí
        </Link>
      </p>
    </div>
  );
}
