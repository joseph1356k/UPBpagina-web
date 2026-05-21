/**
 * POST /api/auth/graduate/verify-otp
 *
 * Body:  { graduateId: string, code: string }
 * Resp:  { ok: true } (sets HttpOnly cookie `upb_graduate_session`)
 *        | { ok: false, error: "invalid_code" | "expired" | "too_many_attempts", attemptsLeft? }
 */

import { NextResponse, type NextRequest } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import { USE_SUPABASE } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { parseJson, VerifyOtpBody } from "@/lib/security/schemas";

export const GRADUATE_SESSION_COOKIE = "upb_graduate_session";

export async function POST(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }

  // 1. IP rate limit (20/min — generous; user retries are common)
  const rl = rateLimit(request, "verify-otp", { max: 20, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  // 2. CSRF
  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  // 3. Validate body
  const parsed = await parseJson(request, VerifyOtpBody);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }
  const { graduateId, code } = parsed.data;

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("graduate_verify_otp", {
    p_graduate_id: graduateId,
    p_code: code,
  });
  if (error) {
    console.error("[verify-otp] rpc error:", error.message);
    return NextResponse.json({ ok: false, error: "unknown" }, { status: 500 });
  }

  const rpc = data as {
    ok: boolean;
    error?: "invalid_code" | "expired" | "too_many_attempts";
    attemptsLeft?: number;
    sessionToken?: string;
    expiresAt?: string;
  };

  if (!rpc.ok) {
    return NextResponse.json(
      { ok: false, error: rpc.error, attemptsLeft: rpc.attemptsLeft },
      { status: rpc.error === "expired" ? 410 : 401 },
    );
  }

  if (!rpc.sessionToken || !rpc.expiresAt) {
    return NextResponse.json({ ok: false, error: "unknown" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(GRADUATE_SESSION_COOKIE, rpc.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",   // hardened from "lax" — no cross-site cookie leaks
    path: "/",
    expires: new Date(rpc.expiresAt),
  });
  return response;
}
