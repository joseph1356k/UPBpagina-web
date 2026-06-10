/**
 * POST /api/admin/graduates/import — bulk-insert graduates for a ceremony.
 *
 * Body shape:
 *   {
 *     ceremonyId: string,
 *     rows: BulkGraduateInput[]  // already validated client-side
 *   }
 *
 * Returns: { ok, inserted, skipped, errors }
 *
 * Notes:
 *   - The client parses the Excel/CSV with lib/excel/parse-graduates and
 *     ships only rows that passed validation (`validation !== "error"`).
 *   - The server does NOT re-parse the file — it trusts the structured
 *     payload, but still validates field types via zod.
 *   - ON CONFLICT (ceremony_id, document_number) DO NOTHING → safe to retry.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { parseJson } from "@/lib/security/schemas";
import { requireStaff } from "@/lib/security/staff-auth";

const BulkRow = z.object({
  documentType: z.enum(["CC", "CE", "TI", "PP"]),
  documentNumber: z.string().trim().min(6).max(15),
  studentCode: z.string().trim().max(20).optional().default(""),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(120),
  program: z.string().trim().min(2).max(150),
  faculty: z.string().trim().min(2).max(150),
  maxGuests: z.number().int().min(0).max(20).nullable().optional(),
  status: z
    .enum(["eligible", "not_eligible", "registered", "completed"])
    .optional()
    .default("eligible"),
});

const Body = z.object({
  ceremonyId: z.string().trim().min(1).max(64),
  rows: z.array(BulkRow).min(1).max(5000),
});

export async function POST(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }

  const rl = rateLimit(request, "admin-graduates-import", {
    max: 10,
    windowMs: 60_000,
  });
  if (!rl.ok) return rl.response;

  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  const auth = await requireStaff(["admin", "coordinator"]);
  if (!auth.ok) return auth.response;

  const parsed = await parseJson(request, Body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const { bulkCreateGraduates } = await import("@/lib/db");
  try {
    const result = await bulkCreateGraduates(parsed.data.ceremonyId, parsed.data.rows);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[admin/graduates/import] failed:", err);
    const message = err instanceof Error ? err.message : "import_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
