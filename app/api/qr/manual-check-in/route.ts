/**
 * POST /api/qr/manual-check-in
 *
 * Admit a guest by id (no QR). Atomic — the DB function locks the row, checks
 * status, marks checked-in and logs a scan_event with method='manual'.
 *
 * Body:  { guestId: string }
 * Resp:  { result, reason, guestName, guestDocument, graduateName, ceremonyName }
 *
 * Requires: authenticated scanner / coordinator / admin.
 */

import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { USE_SUPABASE } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { parseJson, ManualCheckInBody } from "@/lib/security/schemas";

export async function POST(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ error: "mock_mode" }, { status: 501 });
  }

  const rl = await rateLimit(request, "qr-manual", { max: 60, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  // Authenticate + verify role (the DB function checks too)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("users")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();
  if (
    !profile?.active ||
    (profile.role !== "scanner" &&
      profile.role !== "coordinator" &&
      profile.role !== "admin")
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = await parseJson(request, ManualCheckInBody);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { manualCheckIn } = await import("@/lib/db");
  try {
    const r = await manualCheckIn({
      guestId: parsed.data.guestId,
      scannedByUserId: user.id,
    });
    return NextResponse.json({
      result: r.result,
      reason: r.reason,
      warning: r.warning ?? null,
      guestName: r.guest?.fullName ?? null,
      guestDocument: r.guest?.documentNumber ?? null,
      graduateName: r.graduate?.fullName ?? null,
      ceremonyName: r.ceremonyName,
    });
  } catch (err) {
    console.error("[qr/manual-check-in] failed:", err);
    return NextResponse.json({ error: "manual_check_in_failed" }, { status: 500 });
  }
}
