/**
 * POST /api/admin/users — provision a new staff member.
 * Requires: admin role only (not coordinator).
 */

import { NextResponse, type NextRequest } from "next/server";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { parseJson, CreateUserBody } from "@/lib/security/schemas";
import { requireStaff } from "@/lib/security/staff-auth";

export async function POST(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }

  // Tight rate limit — provisioning is rare
  const rl = await rateLimit(request, "admin-users-write", { max: 10, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;

  const parsed = await parseJson(request, CreateUserBody);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const { createUser } = await import("@/lib/db");
  try {
    const user = await createUser(parsed.data);
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error("[admin/users] create failed:", err);
    const msg = err instanceof Error ? err.message : "create_failed";
    return NextResponse.json(
      { ok: false, error: msg.includes("already") ? "email_taken" : "create_failed" },
      { status: 500 },
    );
  }
}
