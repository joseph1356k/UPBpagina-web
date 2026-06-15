"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Turnstile } from "@/components/security/turnstile";
import { createClient } from "@/lib/supabase/client";
import { USE_SUPABASE } from "@/lib/supabase/env";

interface Props {
  redirectTo: string;
}

export function StaffLoginForm({ redirectTo }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Turnstile token ("skip" when disabled). Activates once CAPTCHA is enabled
  // in the Supabase Auth dashboard with the matching Turnstile secret.
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaNonce, setCaptchaNonce] = useState(0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    if (!USE_SUPABASE) {
      // Mock mode — just redirect to /admin (sidebar is open in mock mode)
      startTransition(() => {
        router.push(redirectTo);
        router.refresh();
      });
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
          // Only forward a real token; "skip" means Turnstile is disabled.
          options:
            captchaToken && captchaToken !== "skip"
              ? { captchaToken }
              : undefined,
        });

        if (authErr) {
          // Avoid leaking "user not found" vs "wrong password"
          setError("Correo o contraseña incorrectos.");
          setCaptchaToken("");
          setCaptchaNonce((n) => n + 1); // fresh challenge (single-use token)
          return;
        }

        if (!data.session) {
          setError("No se pudo iniciar la sesión. Intenta de nuevo.");
          return;
        }

        // Verify the user is staff (defense-in-depth — proxy checks too)
        const { data: profile } = await supabase
          .from("users")
          .select("active, role")
          .eq("id", data.session.user.id)
          .maybeSingle();

        if (!profile?.active) {
          await supabase.auth.signOut();
          setError("Tu cuenta está desactivada. Contacta a un administrador.");
          return;
        }
        if (!profile.role) {
          await supabase.auth.signOut();
          setError("Tu cuenta no tiene rol asignado. Contacta a un administrador.");
          return;
        }

        // Touch last_sign_in_at — best effort, ignore failure
        try {
          await supabase.rpc("touch_user_login", {
            p_user_id: data.session.user.id,
          });
        } catch {
          // ignore — not critical
        }

        // Send the user where their role can actually go. A scanner cannot
        // see /admin/* (the proxy gates it), so the default "/admin" redirect
        // would bounce them straight back to this login. Route scanners to
        // /scanner unless they explicitly requested a /scanner/* path.
        const destination =
          profile.role === "scanner" && !redirectTo.startsWith("/scanner")
            ? "/scanner"
            : redirectTo;

        router.push(destination);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Algo salió mal. Intenta de nuevo.",
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Mock mode banner */}
      {!USE_SUPABASE && (
        <div className="rounded-lg border border-info/30 bg-info/5 px-3 py-2 text-xs text-info-foreground">
          <span className="font-medium">Modo demostración:</span> entra con
          cualquier correo y contraseña (no se valida).
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo institucional</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder="nombre@upb.edu.co"
          className="h-10"
          required
          aria-invalid={!!error}
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="••••••••"
            className="h-10 pr-10"
            required
            aria-invalid={!!error}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Security check (renders nothing if Turnstile is disabled) */}
      <Turnstile
        onToken={setCaptchaToken}
        action="staff-login"
        resetKey={captchaNonce}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !captchaToken}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Iniciando sesión…
          </>
        ) : (
          <>
            <LogIn className="size-4" />
            Iniciar sesión
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        ¿Olvidaste tu contraseña? Escríbenos a{" "}
        <a
          href="mailto:soporte.ceremonias@upb.edu.co"
          className="text-primary underline underline-offset-4 hover:no-underline"
        >
          soporte
        </a>
      </p>
    </form>
  );
}
