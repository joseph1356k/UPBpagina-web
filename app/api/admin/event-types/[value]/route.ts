/**
 * PATCH /api/admin/event-types/[value] — edit a type (built-in or custom)
 *
 * Admins can adjust labels, terminology, default template, custom fields,
 * active flag and order. The slug (value) itself is immutable. Auth: admin.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { parseJson } from "@/lib/security/schemas";
import { requireStaff } from "@/lib/security/staff-auth";

const CustomFieldSchema = z.object({
  key: z.string().trim().regex(/^[a-z][a-z0-9_]{0,29}$/, "clave inválida"),
  label: z.string().trim().min(1).max(60),
  type: z.enum(["text", "number", "date", "select"]),
  options: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  required: z.boolean().optional(),
  hint: z.string().trim().max(120).optional(),
});

const Body = z.object({
  label: z.string().trim().min(2).max(60).optional(),
  eventNoun: z.string().trim().min(2).max(30).optional(),
  participantSingular: z.string().trim().min(2).max(30).optional(),
  participantPlural: z.string().trim().min(2).max(30).optional(),
  guestSingular: z.string().trim().min(2).max(30).optional(),
  guestPlural: z.string().trim().min(2).max(30).optional(),
  invitePhrase: z.string().trim().min(4).max(160).optional(),
  photoRecommended: z.boolean().optional(),
  defaultTemplate: z.enum(["clasica", "elegante", "moderna"]).optional(),
  defaultRegistrationMode: z.enum(["invitation", "self_service"]).optional(),
  customFields: z.array(CustomFieldSchema).max(12).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ value: string }> },
) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }
  const rl = await rateLimit(request, "admin-event-types", { max: 30, windowMs: 60_000 });
  if (!rl.ok) return rl.response;
  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;
  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;

  const { value } = await params;
  const parsed = await parseJson(request, Body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const { updateEventType } = await import("@/lib/db");
  try {
    const type = await updateEventType(value, parsed.data);
    return NextResponse.json({ ok: true, type });
  } catch (err) {
    console.error("[admin/event-types PATCH] failed:", err);
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
}
