/**
 * GET /api/qr/manifest?ceremony=<id>
 *
 * Returns the event's full token list (token + name + status) so the scanner
 * can decide allow/deny/duplicate OFFLINE (B4). Downloaded while online and
 * cached in IndexedDB on the device.
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

  const rl = await rateLimit(request, "qr-manifest", { max: 30, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

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
  if (!ceremonyId || ceremonyId.length > 64) {
    return NextResponse.json({ error: "invalid_ceremony" }, { status: 400 });
  }

  const { getScanManifest } = await import("@/lib/db");
  try {
    const manifest = await getScanManifest(ceremonyId);
    return NextResponse.json({ manifest });
  } catch (err) {
    console.error("[qr/manifest] failed:", err);
    return NextResponse.json({ error: "manifest_failed" }, { status: 500 });
  }
}
