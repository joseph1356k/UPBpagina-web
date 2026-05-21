/**
 * GET /api/invitations/[token]
 *
 * Public endpoint that returns the invitation view for a given QR token.
 * Used by /invitacion/[token] page when running in Supabase mode.
 *
 * Calls the anon-callable Postgres function `get_invitation_by_token`.
 */

import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import { USE_SUPABASE } from "@/lib/supabase/env";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ error: "mock_mode" }, { status: 501 });
  }
  const { token } = await params;
  if (!token) {
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
