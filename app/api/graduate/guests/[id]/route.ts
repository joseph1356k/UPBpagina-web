/**
 * PATCH /api/graduate/guests/[id]   — edit a pending guest
 * DELETE /api/graduate/guests/[id]  — remove (soft-revoke if invited)
 *
 * Auth: graduate session cookie. The DB query filters by both `id` AND
 * `graduate_id = session.graduateId` so a graduate cannot touch another
 * graduate's guests, even by guessing the id.
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

// Each field is optional and may be `null` to explicitly clear it.
// Empty strings are normalised to null at the boundary.
const PatchBody = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  documentNumber: z.string().trim().max(20).nullable().optional(),
  email: z.string().trim().toLowerCase().email().max(120).nullable().optional(),
  relationship: z.string().trim().max(60).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  const parsed = await parseJson(request, PatchBody);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const service = createServiceClient();

  // Verify ownership + that the guest is still pending (editable)
  const { data: current } = await service
    .from("guests")
    .select("id, status, graduate_id")
    .eq("id", id)
    .eq("graduate_id", auth.graduateId)
    .maybeSingle();
  if (!current) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (current.status !== "pending") {
    return NextResponse.json(
      { ok: false, error: "guest_not_editable" },
      { status: 409 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = {};
  const p = parsed.data;
  if (p.fullName !== undefined) update.full_name = p.fullName;
  if (p.documentNumber !== undefined) {
    update.document_number = p.documentNumber
      ? p.documentNumber.replace(/\D/g, "") || null
      : null;
  }
  if (p.email !== undefined) update.email = p.email || null;
  if (p.relationship !== undefined) update.relationship = p.relationship || null;

  const { data, error } = await service
    .from("guests")
    .update(update)
    .eq("id", id)
    .eq("graduate_id", auth.graduateId)
    .select()
    .single();
  if (error) {
    console.error("[graduate/guests PATCH] failed:", error);
    return NextResponse.json(
      { ok: false, error: "update_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, guest: guestFromRow(data) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: current } = await service
    .from("guests")
    .select("id, status, graduate_id")
    .eq("id", id)
    .eq("graduate_id", auth.graduateId)
    .maybeSingle();
  if (!current) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (current.status === "checked_in") {
    return NextResponse.json(
      { ok: false, error: "guest_checked_in" },
      { status: 409 },
    );
  }

  if (current.status === "invited") {
    // Soft revoke — keeps audit trail
    const { data, error } = await service
      .from("guests")
      .update({ status: "revoked" })
      .eq("id", id)
      .eq("graduate_id", auth.graduateId)
      .select()
      .single();
    if (error) {
      console.error("[graduate/guests DELETE] revoke failed:", error);
      return NextResponse.json(
        { ok: false, error: "revoke_failed" },
        { status: 500 },
      );
    }
    return NextResponse.json({
      ok: true,
      guest: guestFromRow(data),
      mode: "revoked",
    });
  }

  // Pending or revoked → hard delete
  const { error } = await service
    .from("guests")
    .delete()
    .eq("id", id)
    .eq("graduate_id", auth.graduateId);
  if (error) {
    console.error("[graduate/guests DELETE] hard delete failed:", error);
    return NextResponse.json(
      { ok: false, error: "delete_failed" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, mode: "deleted" });
}
