/**
 * POST /api/auth/graduate/sign-out
 *
 * Clears the graduate session cookie AND revokes the token in the DB
 * (so even if the cookie is leaked, it's already invalid).
 */

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import { USE_SUPABASE } from "@/lib/supabase/env";
import { assertSameOrigin } from "@/lib/security/csrf";
import { GRADUATE_SESSION_COOKIE } from "../verify-otp/route";

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  // Revoke server-side too if we're in real mode
  if (USE_SUPABASE) {
    const cookieStore = await cookies();
    const token = cookieStore.get(GRADUATE_SESSION_COOKIE)?.value;
    if (token) {
      const service = createServiceClient();
      await service.rpc("graduate_revoke_session", { p_token: token });
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(GRADUATE_SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });
  return response;
}
