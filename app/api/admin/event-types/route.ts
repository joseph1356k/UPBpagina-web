/**
 * GET  /api/admin/event-types — list all types (admin)
 * POST /api/admin/event-types — create a new custom type
 *
 * Built-in types can be edited (PATCH) but the catalog is admin-owned.
 * Auth: admin only.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { parseJson } from "@/lib/security/schemas";
import { requireStaff } from "@/lib/security/staff-auth";
import { EVENT_TYPE_SLUG_RE } from "@/lib/terminology";

const CustomFieldSchema = z.object({
  key: z.string().trim().regex(/^[a-z][a-z0-9_]{0,29}$/, "clave inválida"),
  label: z.string().trim().min(1).max(60),
  type: z.enum(["text", "number", "date", "select"]),
  options: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  required: z.boolean().optional(),
  hint: z.string().trim().max(120).optional(),
});

const Body = z.object({
  value: z.string().trim().regex(EVENT_TYPE_SLUG_RE, "slug inválido"),
  label: z.string().trim().min(2).max(60),
  eventNoun: z.string().trim().min(2).max(30),
  participantSingular: z.string().trim().min(2).max(30),
  participantPlural: z.string().trim().min(2).max(30),
  guestSingular: z.string().trim().min(2).max(30),
  guestPlural: z.string().trim().min(2).max(30),
  invitePhrase: z.string().trim().min(4).max(160),
  photoRecommended: z.boolean(),
  defaultTemplate: z.enum(["clasica", "elegante", "moderna"]),
  customFields: z.array(CustomFieldSchema).max(12).optional(),
});

export async function GET() {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }
  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;

  const { getEventTypes } = await import("@/lib/db");
  const types = await getEventTypes();
  return NextResponse.json({ ok: true, types });
}

export async function POST(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }
  const rl = rateLimit(request, "admin-event-types", { max: 20, windowMs: 60_000 });
  if (!rl.ok) return rl.response;
  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;
  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;

  const parsed = await parseJson(request, Body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const { createEventType } = await import("@/lib/db");
  try {
    const type = await createEventType(parsed.data);
    return NextResponse.json({ ok: true, type });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "create_failed";
    // Unique violation → slug already taken
    if (msg.includes("duplicate") || msg.includes("event_types_pkey")) {
      return NextResponse.json(
        { ok: false, error: "slug_taken" },
        { status: 409 },
      );
    }
    console.error("[admin/event-types POST] failed:", err);
    return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  }
}
