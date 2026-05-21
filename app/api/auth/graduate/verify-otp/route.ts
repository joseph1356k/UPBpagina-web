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

export const GRADUATE_SESSION_COOKIE = "upb_graduate_session";

export async function POST(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json(
      { ok: false, error: "mock_mode" },
      { status: 501 },
    );
  }

  let body: { graduateId?: unknown; code?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const graduateId =
    typeof body.graduateId === "string" ? body.graduateId : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!graduateId || !/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("graduate_verify_otp", {
    p_graduate_id: graduateId,
    p_code: code,
  });
  if (error) {
    console.error("[verify-otp] rpc error:", error);
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
    sameSite: "lax",
    path: "/",
    expires: new Date(rpc.expiresAt),
  });
  return response;
}
