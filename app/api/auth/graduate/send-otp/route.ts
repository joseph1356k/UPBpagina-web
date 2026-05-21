/**
 * POST /api/auth/graduate/send-otp
 *
 * Body:  { documentNumber: string }
 * Resp:  { ok: true, graduateId: string, maskedEmail: string }
 *        | { ok: false, error: "not_found" | "not_eligible" | "rate_limit" }
 *
 * Flow:
 *   1. Look up graduate by document
 *   2. Generate OTP via Postgres function (hashed in DB)
 *   3. Email plain code via Resend
 *   4. Return graduateId so the client can call verify-otp
 */

import { NextResponse, type NextRequest } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import { USE_SUPABASE } from "@/lib/supabase/env";
import { otpEmailTemplate, sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json(
      { ok: false, error: "mock_mode" },
      {
        status: 501,
        statusText:
          "API route is a no-op in mock mode. Set NEXT_PUBLIC_USE_SUPABASE=true.",
      },
    );
  }

  let body: { documentNumber?: unknown };
  try {
    body = (await request.json()) as { documentNumber?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const doc =
    typeof body.documentNumber === "string"
      ? body.documentNumber.replace(/\D/g, "")
      : "";
  if (!doc || doc.length < 6 || doc.length > 12) {
    return NextResponse.json(
      { ok: false, error: "validation_doc_number" },
      { status: 400 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("graduate_generate_otp", {
    p_document_number: doc,
    p_ip: ip,
  });
  if (error) {
    console.error("[send-otp] rpc error:", error);
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

  // Send email (logs to console if RESEND_API_KEY missing)
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
    console.error("[send-otp] email send failed:", err);
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
