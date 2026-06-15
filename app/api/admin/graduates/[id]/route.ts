/**
 * PATCH /api/admin/graduates/[id] — update graduate.
 * Requires: admin or coordinator.
 */

import { NextResponse, type NextRequest } from "next/server";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { parseJson, UpdateGraduateBody } from "@/lib/security/schemas";
import { requireStaff } from "@/lib/security/staff-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }

  const rl = await rateLimit(request, "admin-graduates-write", { max: 60, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  const auth = await requireStaff(["admin", "coordinator"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id || id.length > 64) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  const parsed = await parseJson(request, UpdateGraduateBody);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const { updateGraduateAdmin } = await import("@/lib/db");
  try {
    const graduate = await updateGraduateAdmin(id, parsed.data);
    return NextResponse.json({ ok: true, graduate });
  } catch (err) {
    console.error("[admin/graduates] update failed:", err);
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
}
