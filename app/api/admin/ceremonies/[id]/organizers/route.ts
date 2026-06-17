/**
 * POST /api/admin/ceremonies/[id]/organizers — replace an event's organizer set.
 * Requires: admin or coordinator (assigning who can manage an event is not an
 * organizer-self action).
 *
 * Body: { userIds: string[] }
 */

import { NextResponse, type NextRequest } from "next/server";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { parseJson, SetOrganizersBody } from "@/lib/security/schemas";
import { requireStaff } from "@/lib/security/staff-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }

  const rl = await rateLimit(request, "admin-organizers-write", {
    max: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) return rl.response;

  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  const auth = await requireStaff(["admin", "coordinator"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id || id.length > 64) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  const parsed = await parseJson(request, SetOrganizersBody);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const { setEventOrganizers } = await import("@/lib/db");
  try {
    await setEventOrganizers(id, parsed.data.userIds);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/ceremonies/organizers] set failed:", err);
    return NextResponse.json({ ok: false, error: "set_failed" }, { status: 500 });
  }
}
