"use client";

/**
 * Public RSVP form for an open event. Posts to register_attendee (via
 * publicApi), which enforces capacity atomically, then shows the attendee
 * their QR pass on success.
 */

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode } from "@/components/shared/qr-code";
import { Turnstile } from "@/components/security/turnstile";
import { publicApi } from "@/lib/api-client";
import { ROUTES } from "@/lib/constants";

const ERROR_MSG: Record<string, string> = {
  full: "El evento alcanzó su aforo máximo.",
  closed: "El registro para este evento está cerrado.",
  not_found: "No encontramos el evento.",
  not_public: "Este evento no admite registro en línea.",
  captcha: "No pudimos verificar que eres una persona. Intenta de nuevo.",
  mock_mode: "El registro en línea no está disponible en este entorno.",
  network: "Problema de conexión. Intenta de nuevo.",
};

export function RsvpForm({ ceremonyId }: { ceremonyId: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ token: string; already: boolean } | null>(
    null,
  );

  function resetCaptcha() {
    setCaptchaToken("");
    setCaptchaNonce((n) => n + 1);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) {
      setError("Ingresa tu nombre completo.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await publicApi.registerAttendee(ceremonyId, {
        fullName: fullName.trim(),
        email: email.trim(),
        document: docNumber.trim() || null,
        captchaToken,
      });
      if (!r.ok) {
        setError(ERROR_MSG[r.error ?? ""] ?? "No se pudo completar el registro.");
        resetCaptcha();
        return;
      }
      setSuccess({ token: r.token ?? "", already: Boolean(r.already) });
    } catch {
      setError("No se pudo completar el registro. Intenta de nuevo.");
      resetCaptcha();
    } finally {
      setSubmitting(false);
    }
  }

  if (success && success.token) {
    const path = `${ROUTES.invitacion}/${success.token}`;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}${path}`;
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <div>
          <p className="font-medium text-foreground">
            {success.already ? "Ya tenías un registro" : "¡Registro confirmado!"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Este es tu pase de ingreso. Guárdalo o toma una captura — también te
            lo enviamos al correo.
          </p>
        </div>
        <QrCode value={url} size={200} />
        <Button asChild variant="outline" size="sm">
          <a href={path}>Ver mi pase completo</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="rsvp-name">
          Nombre completo <span className="text-destructive">*</span>
        </Label>
        <Input
          id="rsvp-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={120}
          autoComplete="name"
          className="h-9"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rsvp-email">
          Correo electrónico <span className="text-destructive">*</span>
        </Label>
        <Input
          id="rsvp-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={120}
          autoComplete="email"
          className="h-9"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rsvp-doc">Documento (opcional)</Label>
        <Input
          id="rsvp-doc"
          value={docNumber}
          onChange={(e) => setDocNumber(e.target.value)}
          maxLength={20}
          inputMode="numeric"
          className="h-9"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Renders nothing when Turnstile is disabled (sets token to "skip"). */}
      <Turnstile onToken={setCaptchaToken} action="event-register" resetKey={captchaNonce} />

      <Button type="submit" className="w-full" disabled={submitting || !captchaToken}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Registrando…
          </>
        ) : (
          "Registrarme y recibir mi pase"
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        Tus datos se tratan según la Ley 1581 de 2012 de protección de datos.
      </p>
    </form>
  );
}
