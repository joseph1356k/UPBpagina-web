/**
 * GET /api/invitations/[token]
 *
 * Public endpoint that returns the invitation view for a given QR token.
 * Used by /invitacion/[token] page when running in Supabase mode.
 *
 * Calls the anon-callable Postgres function `get_invitation_by_token`.
 */

import { NextResponse, type NextRequest } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import { USE_SUPABASE } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/security/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ error: "mock_mode" }, { status: 501 });
  }

  // Rate-limit anonymous token lookups to deter token-enumeration scans
  const rl = await rateLimit(request, "invitation-lookup", { max: 30, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  const { token } = await params;
  // Strict token format: alphanumeric + dash/underscore, 16-128 chars
  if (!token || !/^[a-zA-Z0-9_-]{16,128}$/.test(token)) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("get_invitation_by_token", {
    p_token: token,
  });
  if (error) {
    console.error("[invitations/get] rpc error:", error);
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
