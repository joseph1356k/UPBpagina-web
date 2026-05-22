/**
 * POST /api/admin/ceremonies — create a new ceremony.
 * Requires: admin or coordinator role.
 */

import { NextResponse, type NextRequest } from "next/server";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { parseJson, CreateCeremonyBody } from "@/lib/security/schemas";
import { requireStaff } from "@/lib/security/staff-auth";

export async function POST(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }

  const rl = rateLimit(request, "admin-ceremonies-write", { max: 30, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  const auth = await requireStaff(["admin", "coordinator"]);
  if (!auth.ok) return auth.response;

  const parsed = await parseJson(request, CreateCeremonyBody);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  // Lazy import lib/db (server-only)
  const { createCeremony } = await import("@/lib/db");
  try {
    const ceremony = await createCeremony(parsed.data);
    return NextResponse.json({ ok: true, ceremony });
  } catch (err) {
    console.error("[admin/ceremonies] create failed:", err);
    return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  }
}
