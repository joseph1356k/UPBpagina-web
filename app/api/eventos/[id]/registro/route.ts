/**
 * POST /api/eventos/[id]/registro
 *
 * Public self-registration (RSVP) for an open, publicly-listed event. Atomic
 * capacity enforcement lives in the register_attendee SQL function; this route
 * adds the public-endpoint defenses (rate-limit + CSRF + Turnstile + zod) and
 * best-effort emails the pass.
 *
 * Body:  { fullName, email, document?, captchaToken? }
 * Resp:  RegisterAttendeeResult { ok, already?, token?, fullName?, error? }
 */

import { NextResponse, type NextRequest } from "next/server";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { verifyTurnstile } from "@/lib/security/captcha";
import { parseJson, RegisterAttendeeBody } from "@/lib/security/schemas";
import { sendEmail } from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }

  // Public endpoint → stricter rate limit.
  const rl = await rateLimit(request, "event-register", { max: 10, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  const { id } = await params;
  if (!id || id.length > 64) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  const parsed = await parseJson(request, RegisterAttendeeBody);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const captcha = await verifyTurnstile(parsed.data.captchaToken, ip);
  if (!captcha.ok) {
    return NextResponse.json({ ok: false, error: "captcha" }, { status: 400 });
  }

  const { registerAttendee } = await import("@/lib/db");
  try {
    const result = await registerAttendee(id, {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      document: parsed.data.document ?? null,
    });

    // Best-effort: email the pass on a fresh registration (never blocks).
    if (result.ok && !result.already && result.token) {
      try {
        const url = `${BASE_URL}/invitacion/${result.token}`;
        const first = parsed.data.fullName.split(" ")[0] ?? "";
        await sendEmail({
          to: parsed.data.email,
          subject: "Tu pase de ingreso · UPB",
          html: `<p>¡Hola!</p><p>Tu registro quedó confirmado. Este es tu pase de ingreso con código QR:</p><p><a href="${url}">${url}</a></p><p>Guárdalo: lo necesitarás para ingresar al evento. Funciona incluso sin conexión.</p><p>— Universidad Pontificia Bolivariana</p>`,
          text: `Hola ${first},\n\nTu registro quedó confirmado. Tu pase de ingreso:\n${url}\n\nGuárdalo: lo necesitarás para ingresar al evento.\n\n— Universidad Pontificia Bolivariana`,
        });
      } catch (e) {
        console.error("[eventos/registro] email failed:", e);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[eventos/registro] failed:", err);
    return NextResponse.json(
      { ok: false, error: "register_failed" },
      { status: 500 },
    );
  }
}
