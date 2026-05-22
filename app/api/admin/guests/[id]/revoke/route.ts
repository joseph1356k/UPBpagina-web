/**
 * POST /api/admin/guests/[id]/revoke — revoke a guest's invitation.
 */

import { NextResponse, type NextRequest } from "next/server";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { requireStaff } from "@/lib/security/staff-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }

  const rl = rateLimit(request, "admin-guests-revoke", { max: 60, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  const auth = await requireStaff(["admin", "coordinator"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id || id.length > 64) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  const { revokeGuestAdmin } = await import("@/lib/db");
  try {
    const guest = await revokeGuestAdmin(id);
    return NextResponse.json({ ok: true, guest });
  } catch (err) {
    console.error("[admin/guests] revoke failed:", err);
    return NextResponse.json({ ok: false, error: "revoke_failed" }, { status: 500 });
  }
}
