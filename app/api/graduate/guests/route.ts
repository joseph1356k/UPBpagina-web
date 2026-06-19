/**
 * POST /api/graduate/guests
 *
 * Creates a new guest for the authenticated graduate.
 *
 * Body:  { fullName, documentNumber?, email?, relationship? }
 * Resp:  { ok: true, guest }
 *
 * Auth: graduate session cookie (HttpOnly).
 * Quota: the `enforce_guest_quota` trigger blocks inserts past max_guests.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/service";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { parseJson } from "@/lib/security/schemas";
import { requireGraduate } from "@/lib/security/graduate-auth";
import { guestFromRow } from "@/lib/db/mappers";

const Body = z.object({
  fullName: z.string().trim().min(2).max(120),
  documentNumber: z
    .string()
    .trim()
    .max(20)
    .transform((s) => (s ? s.replace(/\D/g, "") : ""))
    .optional()
    .nullable()
    .transform((s) => (s ? s : null)),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(120)
    .optional()
    .nullable()
    .transform((s) => (s ? s : null)),
  relationship: z
    .string()
    .trim()
    .max(60)
    .optional()
    .nullable()
    .transform((s) => (s ? s : null)),
});

export async function POST(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }

  const rl = await rateLimit(request, "graduate-guests-write", {
    max: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) return rl.response;

  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  const auth = await requireGraduate();
  if (!auth.ok) return auth.response;

  const parsed = await parseJson(request, Body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const service = createServiceClient();

  // Need ceremony_id for the FK — pull from the graduate row.
  const { data: grad } = await service
    .from("graduates")
    .select("ceremony_id")
    .eq("id", auth.graduateId)
    .maybeSingle();
  if (!grad) {
    return NextResponse.json(
      { ok: false, error: "graduate_not_found" },
      { status: 404 },
    );
  }

  const { data, error } = await service
    .from("guests")
    .insert({
      graduate_id: auth.graduateId,
      full_name: parsed.data.fullName,
      document_number: parsed.data.documentNumber,
      email: parsed.data.email,
      relationship: parsed.data.relationship,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    // The DB trigger raises 'cupo_lleno' when the quota is exceeded
    if (error.message?.toLowerCase().includes("cupo_lleno")) {
      return NextResponse.json(
        { ok: false, error: "quota_exceeded" },
        { status: 409 },
      );
    }
    console.error("[graduate/guests POST] insert failed:", error);
    return NextResponse.json(
      { ok: false, error: "create_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, guest: guestFromRow(data) });
}
