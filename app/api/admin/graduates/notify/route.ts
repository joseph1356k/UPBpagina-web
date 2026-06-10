/**
 * POST /api/admin/graduates/notify — send the "register your guests"
 * welcome email to graduates of a ceremony.
 *
 * Body: {
 *   ceremonyId: string,
 *   onlyUnnotified?: boolean   // default true — skip already-notified rows
 * }
 *
 * Resp: { ok, sent, skipped, failed }
 *
 * Auth: admin or coordinator. Heavy rate-limit (it's a mass-mail trigger).
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail, welcomeGraduateEmailTemplate } from "@/lib/email";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { parseJson } from "@/lib/security/schemas";
import { requireStaff } from "@/lib/security/staff-auth";
import { formatDateLong, formatDateTime, formatTime } from "@/lib/format";

const Body = z.object({
  ceremonyId: z.string().trim().min(1).max(64),
  onlyUnnotified: z.boolean().optional().default(true),
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }

  // Mass-mail trigger — keep the window tight
  const rl = rateLimit(request, "admin-graduates-notify", {
    max: 3,
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
  const { ceremonyId, onlyUnnotified } = parsed.data;

  const service = createServiceClient();

  const { data: ceremony } = await service
    .from("ceremonies")
    .select("*")
    .eq("id", ceremonyId)
    .maybeSingle();
  if (!ceremony) {
    return NextResponse.json(
      { ok: false, error: "ceremony_not_found" },
      { status: 404 },
    );
  }

  let query = service
    .from("graduates")
    .select("id, full_name, email, max_guests, status, notified_at")
    .eq("ceremony_id", ceremonyId)
    .neq("status", "not_eligible");
  if (onlyUnnotified) {
    query = query.is("notified_at", null);
  }
  const { data: graduates, error: gradErr } = await query;
  if (gradErr) {
    console.error("[notify] fetch graduates failed:", gradErr);
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 500 });
  }
  if (!graduates || graduates.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 0, failed: 0 });
  }

  const portalUrl = `${BASE_URL}/registro`;
  const ceremonyDate = formatDateLong(ceremony.date);
  const ceremonyTime = formatTime(ceremony.start_time);
  const ceremonyVenue = `${ceremony.venue}, ${ceremony.campus}`;
  const closesAt = formatDateTime(ceremony.registration_closes_at);

  let sent = 0;
  let failed = 0;
  const notifiedIds: string[] = [];

  for (const grad of graduates) {
    if (!grad.email) {
      failed++;
      continue;
    }
    const tpl = welcomeGraduateEmailTemplate({
      graduateName: grad.full_name,
      ceremonyName: ceremony.name,
      ceremonyDate,
      ceremonyTime,
      ceremonyVenue,
      maxGuests: grad.max_guests,
      registrationClosesAt: closesAt,
      portalUrl,
    });
    try {
      await sendEmail({ to: grad.email, ...tpl });
      sent++;
      notifiedIds.push(grad.id);
    } catch (err) {
      console.error(`[notify] failed for graduate ${grad.id}:`, err);
      failed++;
    }
  }

  // Stamp notified_at on everyone we actually reached
  if (notifiedIds.length > 0) {
    await service
      .from("graduates")
      .update({ notified_at: new Date().toISOString() })
      .in("id", notifiedIds);
  }

  // Leave a trace in the audit log
  await service.from("audit_log").insert({
    actor_id: auth.userId,
    action: "send_invitation",
    entity_type: "ceremony",
    entity_id: ceremonyId,
    summary: `Notificó a ${sent} graduandos de "${ceremony.name}"`,
  });

  return NextResponse.json({ ok: true, sent, skipped: 0, failed });
}
