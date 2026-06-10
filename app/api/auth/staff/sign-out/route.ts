/**
 * POST /api/auth/staff/sign-out
 *
 * Ends the staff (Supabase Auth) session by clearing the SSR cookies.
 */

import { NextResponse, type NextRequest } from "next/server";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { assertSameOrigin } from "@/lib/security/csrf";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  if (USE_SUPABASE) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  return NextResponse.json({ ok: true });
}
