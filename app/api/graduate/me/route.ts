/**
 * GET /api/graduate/me
 *
 * Returns the authenticated graduate's profile + ceremony + guests in one
 * round trip. The browser portal's auth-provider calls this once on mount.
 *
 * Auth: graduate session cookie (HttpOnly, set by verify-otp).
 */

import { NextResponse } from "next/server";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/service";
import { requireGraduate } from "@/lib/security/graduate-auth";
import {
  ceremonyFromRow,
  graduateFromRow,
  guestFromRow,
} from "@/lib/db/mappers";

export async function GET() {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }

  const auth = await requireGraduate();
  if (!auth.ok) return auth.response;

  const service = createServiceClient();

  // All queries filter by the graduateId derived from the session cookie.
  // Never trust an inbound id from the client.
  const [gradRes, guestsRes] = await Promise.all([
    service.from("graduates").select("*").eq("id", auth.graduateId).maybeSingle(),
    service
      .from("guests")
      .select("*")
      .eq("graduate_id", auth.graduateId)
      .order("created_at", { ascending: true }),
  ]);

  if (gradRes.error || !gradRes.data) {
    return NextResponse.json(
      { ok: false, error: "graduate_not_found" },
      { status: 404 },
    );
  }

  const graduate = graduateFromRow(gradRes.data);
  const guests = (guestsRes.data ?? []).map(guestFromRow);

  const cerRes = await service
    .from("ceremonies")
    .select("*")
    .eq("id", graduate.ceremonyId)
    .maybeSingle();

  if (cerRes.error || !cerRes.data) {
    return NextResponse.json(
      { ok: false, error: "ceremony_not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    graduate,
    ceremony: ceremonyFromRow(cerRes.data),
    guests,
  });
}
