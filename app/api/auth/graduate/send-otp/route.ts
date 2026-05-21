/**
 * POST /api/auth/graduate/send-otp
 *
 * Body:  { documentNumber: string }
 * Resp:  { ok: true, graduateId: string, maskedEmail: string }
 *        | { ok: false, error: "not_found" | "not_eligible" | "rate_limit" }
 *
 * Defenses (in order):
 *   1. IP rate-limit (10/min) — block scrapers cheaply
 *   2. CSRF (same-origin check)
 *   3. zod validation
 *   4. DB rate-limit (5/15min per document) — backstop
 *
 * The OTP is generated server-side (CSPRNG) and stored hashed; only the
 * plaintext email body sees it.
 */

import { NextResponse, type NextRequest } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import { USE_SUPABASE } from "@/lib/supabase/env";
import { otpEmailTemplate, sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { parseJson, SendOtpBody } from "@/lib/security/schemas";

export async function POST(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }

  // 1. IP-based rate limit (10 per minute per IP)
  const rl = rateLimit(request, "send-otp", { max: 10, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  // 2. CSRF
  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  // 3. Validate body
  const parsed = await parseJson(request, SendOtpBody);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: "validation_doc_number", detail: parsed.error },
      { status: 400 },
    );
  }
  const { documentNumber } = parsed.data;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // 4. DB-level rate limit + OTP generation (atomic)
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("graduate_generate_otp", {
    p_document_number: documentNumber,
    p_ip: ip,
  });
  if (error) {
    console.error("[send-otp] rpc error:", error.message);
    return NextResponse.json({ ok: false, error: "unknown" }, { status: 500 });
  }

  const rpc = data as {
    ok: boolean;
    error?: "not_found" | "not_eligible" | "rate_limit";
    graduateId?: string;
    graduateName?: string;
    email?: string;
    code?: string;
  };

  if (!rpc.ok) {
    return NextResponse.json(
      { ok: false, error: rpc.error ?? "unknown" },
      { status: rpc.error === "rate_limit" ? 429 : 404 },
    );
  }

  if (!rpc.email || !rpc.code || !rpc.graduateId || !rpc.graduateName) {
    return NextResponse.json({ ok: false, error: "unknown" }, { status: 500 });
  }

  try {
    const tpl = otpEmailTemplate({
      graduateName: rpc.graduateName,
      code: rpc.code,
      ttlMinutes: 10,
    });
    await sendEmail({ to: rpc.email, ...tpl });
  } catch (err) {
    // Log without leaking the email address
    console.error(
      "[send-otp] email send failed:",
      err instanceof Error ? err.message : "unknown",
    );
    return NextResponse.json(
      { ok: false, error: "email_failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    graduateId: rpc.graduateId,
    maskedEmail: maskEmail(rpc.email),
  });
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${"*".repeat(Math.max(1, user.length - 2))}${user[user.length - 1]}@${domain}`;
}
