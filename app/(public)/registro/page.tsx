"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BrandMark } from "@/components/shared/brand-mark";
import { Turnstile } from "@/components/security/turnstile";
import { DOCUMENT_TYPE_LABEL, ROUTES } from "@/lib/constants";
import { USE_SUPABASE } from "@/lib/supabase/env";
import { getGraduateByDocument } from "@/lib/mock";
import type { DocumentType } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const DOCUMENT_TYPES: DocumentType[] = ["CC", "CE", "TI", "PP"];
const MAX_ATTEMPTS = 5;

type FormError =
  | "validation_doc_type"
  | "validation_doc_number"
  | "not_found"
  | "not_eligible"
  | "rate_limit"
  | "captcha"
  | "unknown";

const ERROR_COPY: Record<FormError, { title: string; body: string }> = {
  validation_doc_type: {
    title: "Tipo de documento requerido",
    body: "Selecciona el tipo de documento antes de continuar.",
  },
  validation_doc_number: {
    title: "Número de documento inválido",
    body: "Ingresa solo dígitos (mínimo 6 caracteres).",
  },
  not_found: {
    title: "Graduando no encontrado",
    body: "No encontramos ningún graduando con ese documento. Verifica el tipo y el número, o comunícate con la Secretaría Académica.",
  },
  not_eligible: {
    title: "Registro no habilitado",
    body: "Tu proceso de grado no está habilitado para el registro de invitados en este momento. Comunícate con la Secretaría Académica.",
  },
  rate_limit: {
    title: "Demasiados intentos",
    body: "Por seguridad, el acceso ha sido bloqueado temporalmente. Espera 10 minutos e inténtalo de nuevo.",
  },
  captcha: {
    title: "Verificación de seguridad fallida",
    body: "No pudimos confirmar que eres una persona. Espera un momento e inténtalo de nuevo.",
  },
  unknown: {
    title: "Error inesperado",
    body: "Ocurrió un problema al procesar tu solicitud. Intenta de nuevo.",
  },
};

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function RegistroPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [docType, setDocType] = useState<DocumentType | "">("");
  const [docNumber, setDocNumber] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<FormError | null>(null);
  // Turnstile token ("skip" when Turnstile is disabled). nonce forces a fresh
  // challenge after a failed attempt (tokens are single-use).
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaNonce, setCaptchaNonce] = useState(0);

  function resetCaptcha() {
    setCaptchaToken("");
    setCaptchaNonce((n) => n + 1);
  }

  function handleDocNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Strip non-digits while the user types
    setDocNumber(e.target.value.replace(/\D/g, ""));
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // ── Client-side validation ─────────────────────────────────────
    if (!docType) {
      setError("validation_doc_type");
      return;
    }
    if (docNumber.length < 6) {
      setError("validation_doc_number");
      return;
    }
    if (attempts >= MAX_ATTEMPTS) {
      setError("rate_limit");
      return;
    }

    startTransition(async () => {
      try {
        if (USE_SUPABASE) {
          // Real mode: skip the pre-lookup (we don't have RLS access from
          // the browser anyway) and call the OTP endpoint directly. It
          // validates the graduate, generates the code, and emails it.
          const res = await fetch("/api/auth/graduate/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              documentNumber: docNumber,
              captchaToken,
            }),
          });
          const json = await res.json().catch(() => ({}));

          if (!res.ok || json.ok === false) {
            const err = (json.error ?? "unknown") as string;
            if (
              err === "not_found" ||
              err === "not_eligible" ||
              err === "rate_limit" ||
              err === "captcha"
            ) {
              setError(err);
            } else {
              setError("unknown");
            }
            setAttempts((n) => n + 1);
            resetCaptcha(); // token is single-use — get a fresh one
            return;
          }

          // graduateId comes back so the next page knows who to verify.
          router.push(`${ROUTES.registroVerificacion}?gid=${json.graduateId}`);
        } else {
          // Mock mode: in-memory lookup.
          const graduate = await getGraduateByDocument({ documentNumber: docNumber });

          if (!graduate || graduate.documentType !== docType) {
            setAttempts((n) => n + 1);
            setError("not_found");
            return;
          }

          if (graduate.status === "not_eligible") {
            setError("not_eligible");
            return;
          }

          router.push(`${ROUTES.registroVerificacion}?gid=${graduate.id}`);
        }
      } catch {
        setError("unknown");
      }
    });
  }

  const isDocNumberInvalid =
    error === "validation_doc_number" || error === "not_found";

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center">
            <BrandMark size="md" variant="lockup" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Registro de invitados
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa tu número de documento para validar tu acceso y comenzar a
            registrar a tus invitados.
          </p>
        </div>

        {/* ── Form card ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Document type */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-type-trigger">Tipo de documento</Label>
              <Select
                value={docType || undefined}
                onValueChange={(v) => {
                  setDocType(v as DocumentType);
                  setError(null);
                }}
              >
                <SelectTrigger
                  id="doc-type-trigger"
                  className="w-full"
                  aria-invalid={error === "validation_doc_type" ? true : undefined}
                >
                  <SelectValue placeholder="Selecciona el tipo…" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {DOCUMENT_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Document number */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-number">Número de documento</Label>
              <Input
                id="doc-number"
                type="text"
                inputMode="numeric"
                placeholder="Ej. 1234567890"
                value={docNumber}
                onChange={handleDocNumberChange}
                aria-invalid={isDocNumberInvalid ? true : undefined}
                autoComplete="off"
                maxLength={12}
                className="h-10"
              />
            </div>

            {/* Error alert */}
            {error && (
              <div
                role="alert"
                className="flex gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">
                    {ERROR_COPY[error].title}
                  </p>
                  <p className="mt-0.5 text-destructive/80">
                    {ERROR_COPY[error].body}
                  </p>
                </div>
              </div>
            )}

            {/* Security check (renders nothing if Turnstile is disabled) */}
            <Turnstile
              onToken={setCaptchaToken}
              action="send-otp"
              resetKey={captchaNonce}
            />

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-10"
              disabled={isPending || !captchaToken}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verificando…
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* ── Footer links ───────────────────────────────────────────── */}
        <div className="mt-6 space-y-1 text-center text-xs text-muted-foreground">
          <p>
            ¿Problemas con tu acceso?{" "}
            <a
              href="mailto:secretaria.academica@upb.edu.co"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Contactar Secretaría Académica
            </a>
          </p>
          <p>
            ¿Eres administrador?{" "}
            <Link
              href={ROUTES.admin}
              className="underline underline-offset-4 hover:text-foreground"
            >
              Acceder al panel
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
