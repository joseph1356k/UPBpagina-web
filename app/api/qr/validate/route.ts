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
 */

import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { USE_SUPABASE } from "@/lib/supabase/env";

export async function POST(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ error: "mock_mode" }, { status: 501 });
  }

  let body: { token?: unknown };
  try {
    body = (await request.json()) as { token?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  // Identify the scanner (must be authenticated staff)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Call the SECURITY DEFINER function with service role so RLS is bypassed
  // for the atomic scan operation (the function itself verifies the scanner).
  const service = createServiceClient();
  const { data, error } = await service.rpc("validate_qr_token", {
    p_token: token,
    p_scanner_id: user.id,
  });
  if (error) {
    console.error("[qr/validate] rpc error:", error);
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }

  return NextResponse.json(data);
}
