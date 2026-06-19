/**
 * PATCH /api/admin/users/[id] — update staff member.
 * Requires: admin role only.
 */

import { NextResponse, type NextRequest } from "next/server";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { parseJson, UpdateUserBody } from "@/lib/security/schemas";
import { requireStaff } from "@/lib/security/staff-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }

  const rl = await rateLimit(request, "admin-users-write", { max: 20, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id || id.length > 64) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  // Prevent admins from deactivating themselves (lockout protection)
  const parsed = await parseJson(request, UpdateUserBody);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }
  if (id === auth.userId && parsed.data.active === false) {
    return NextResponse.json(
      { ok: false, error: "cannot_deactivate_self" },
      { status: 400 },
    );
  }
  if (id === auth.userId && parsed.data.role && parsed.data.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "cannot_demote_self" },
      { status: 400 },
    );
  }

  const { updateUser } = await import("@/lib/db");
  try {
    const user = await updateUser(id, parsed.data);
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error("[admin/users] update failed:", err);
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
}
