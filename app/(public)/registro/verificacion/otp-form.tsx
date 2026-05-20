"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FlaskConical,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { saveSession } from "@/lib/session";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Ceremony, Graduate } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

/** Fixed OTP for the development mock. */
const DEV_OTP = "123456";
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_S = 60;
const DIGITS = 6;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface OtpVerificationFormProps {
  graduate: Graduate;
  ceremony: Ceremony;
}

export function OtpVerificationForm({
  graduate,
  ceremony,
}: OtpVerificationFormProps) {
  const router = useRouter();

  const [digits, setDigits] = useState<string[]>(Array(DIGITS).fill(""));
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_S);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((n) => n - 1), 1_000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const otp = digits.join("");
  const isComplete = otp.length === DIGITS;
  const isExhausted = attempts >= MAX_ATTEMPTS;

  /* ── Input handlers ─────────────────────────────────────────────── */

  function handleChange(idx: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    setError(null);
    if (char && idx < DIGITS - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = "";
        setDigits(next);
      } else if (idx > 0) {
        const next = [...digits];
        next[idx - 1] = "";
        setDigits(next);
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < DIGITS - 1) {
      inputRefs.current[idx + 1]?.focus();
    } else if (e.key === "Enter" && isComplete) {
      handleVerify();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGITS);
    if (!text) return;
    const next = Array(DIGITS).fill("") as string[];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    setError(null);
    const focusIdx = Math.min(text.length, DIGITS - 1);
    inputRefs.current[focusIdx]?.focus();
  }

  /* ── Verification ───────────────────────────────────────────────── */

  async function handleVerify() {
    if (!isComplete || isPending || isExhausted) return;

    setIsPending(true);
    setError(null);

    // Simulate network latency
    await new Promise<void>((r) => setTimeout(r, 600));

    if (otp !== DEV_OTP) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      const remaining = MAX_ATTEMPTS - newAttempts;
      setError(
        remaining > 0
          ? `Código incorrecto. Te quedan ${remaining} intento${remaining !== 1 ? "s" : ""}.`
          : "Has agotado todos tus intentos. Vuelve a la página de registro para comenzar de nuevo.",
      );
      setDigits(Array(DIGITS).fill(""));
      setIsPending(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
      return;
    }

    // ✓ Correct OTP
    setIsSuccess(true);
    saveSession({
      graduateId: graduate.id,
      fullName: graduate.fullName,
      ceremonyId: graduate.ceremonyId,
      ceremonyName: ceremony.name,
    });

    await new Promise<void>((r) => setTimeout(r, 700));
    router.push(ROUTES.portal);
  }

  /* ── Resend ─────────────────────────────────────────────────────── */

  function handleResend() {
    if (resendCooldown > 0) return;
    setResendCooldown(RESEND_COOLDOWN_S);
    setAttempts(0);
    setError(null);
    setDigits(Array(DIGITS).fill(""));
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
    // In production: call an API to re-send the OTP email
  }

  /* ── Success screen ─────────────────────────────────────────────── */

  if (isSuccess) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="size-8 text-primary" />
            </div>
          </div>
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Identidad verificada
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Redirigiendo a tu portal…
          </p>
          <Loader2 className="mx-auto mt-4 size-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  /* ── Main form ──────────────────────────────────────────────────── */

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Back link */}
        <Link
          href={ROUTES.registro}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver al registro
        </Link>

        {/* Dev banner */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-700 dark:border-amber-600/30 dark:bg-amber-900/20 dark:text-amber-400">
            <FlaskConical className="size-4 shrink-0" />
            <span>
              <span className="font-semibold">Modo desarrollo — </span>
              código OTP de prueba:{" "}
              <code className="font-mono font-bold tracking-widest">
                {DEV_OTP}
              </code>
            </span>
          </div>
        )}

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">

          {/* Header */}
          <div className="mb-6 flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold leading-snug text-foreground">
                Verifica tu identidad
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Enviamos un código de 6 dígitos a{" "}
                <span className="font-medium text-foreground">
                  {maskEmail(graduate.email)}
                </span>
              </p>
            </div>
          </div>

          {/* OTP boxes */}
          <div
            className="mb-4 flex gap-2"
            onPaste={handlePaste}
            aria-label="Código de verificación de 6 dígitos"
          >
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={2}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                aria-label={`Dígito ${i + 1} de ${DIGITS}`}
                autoComplete={i === 0 ? "one-time-code" : "off"}
                disabled={isPending || isExhausted}
                className={cn(
                  "flex h-12 w-full min-w-0 rounded-lg border bg-transparent",
                  "text-center text-lg font-semibold tabular-nums",
                  "transition-colors outline-none select-none",
                  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  "disabled:pointer-events-none disabled:opacity-50",
                  error
                    ? "border-destructive ring-3 ring-destructive/20"
                    : "border-input",
                )}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Verify button */}
          <Button
            className="h-10 w-full"
            onClick={handleVerify}
            disabled={!isComplete || isPending || isExhausted}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Verificando…
              </>
            ) : (
              "Verificar código"
            )}
          </Button>

          {/* Resend */}
          <div className="mt-4 text-center">
            {resendCooldown > 0 ? (
              <p className="text-sm text-muted-foreground">
                Puedes reenviar en{" "}
                <span className="tabular-nums font-medium text-foreground">
                  0:{String(resendCooldown).padStart(2, "0")}
                </span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <RefreshCw className="size-3.5" />
                Reenviar código
              </button>
            )}
          </div>
        </div>

        {/* Support */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          ¿No recibiste el código?{" "}
          <a
            href="mailto:secretaria.academica@upb.edu.co"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Contactar soporte
          </a>
        </p>
      </div>
    </div>
  );
}
