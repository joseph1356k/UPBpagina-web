/**
 * GET /api/qr/search?ceremony=<id>&q=<term>
 *
 * Scanner fallback — find a ceremony's guests by name or document so staff can
 * admit an attendee who has no phone / QR. Read-only.
 *
 * Requires: authenticated scanner / coordinator / admin.
 */

import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { USE_SUPABASE } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ error: "mock_mode" }, { status: 501 });
  }

  const rl = await rateLimit(request, "qr-search", { max: 120, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  // Authenticate + verify role (defense-in-depth; RLS also applies)
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

  const { searchParams } = new URL(request.url);
  const ceremonyId = (searchParams.get("ceremony") ?? "").trim();
  const query = (searchParams.get("q") ?? "").trim();

  if (!ceremonyId || ceremonyId.length > 64) {
    return NextResponse.json({ error: "invalid_ceremony" }, { status: 400 });
  }
  // Require a minimum query so we never dump the whole guest list.
  if (query.length < 2 || query.length > 80) {
    return NextResponse.json({ results: [] });
  }

  const { searchCeremonyGuests } = await import("@/lib/db");
  try {
    const results = await searchCeremonyGuests({ ceremonyId, query });
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[qr/search] failed:", err);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}
