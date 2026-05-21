/**
 * POST /api/qr/validate
 *
 * Scanner consumes a QR token. Atomic — DB function locks, checks status,
 * marks checked-in, and writes the scan event in one transaction.
 *
 * Body:  { token: string }
 * Resp:  { result: "allowed" | "denied", reason: string|null, guestName: string|null }
 *
 * Requires: authenticated scanner / coordinator / admin.
 *
 * Defenses:
 *   - IP rate-limit (60/min — generous, scanners scan fast on event day)
 *   - CSRF same-origin check
 *   - zod token validation
 *   - Authenticated session required (RLS via auth.uid())
 *   - The DB function verifies the scanner role server-side
 */

import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { USE_SUPABASE } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { parseJson, QrValidateBody } from "@/lib/security/schemas";

export async function POST(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ error: "mock_mode" }, { status: 501 });
  }

  // 1. IP rate limit
  const rl = rateLimit(request, "qr-validate", { max: 60, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  // 2. CSRF
  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  // 3. Validate body
  const parsed = await parseJson(request, QrValidateBody);
  if (!parsed.ok) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }
  const { token } = parsed.data;

  // 4. Authenticate the scanner (must be in auth.users + active staff)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Verify role (defense-in-depth — DB function checks too)
  const { data: profile } = await supabase
    .from("users")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();
  if (
    !profile?.active ||
    (profile.role !== "scanner" && profile.role !== "coordinator" && profile.role !== "admin")
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // 5. Atomic validate via SECURITY DEFINER function
  const service = createServiceClient();
  const { data, error } = await service.rpc("validate_qr_token", {
    p_token: token,
    p_scanner_id: user.id,
  });
  if (error) {
    console.error("[qr/validate] rpc error:", error.message);
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }

  return NextResponse.json(data);
}
