/**
 * POST /api/guests/send-invitations
 *
 * Sends invitation emails for all `pending` guests of a given graduate.
 *
 * Body:  { graduateId: string }
 * Resp:  { ok: true, sent: number, skipped: number }
 *
 * Requires: authenticated user who is either:
 *   - the graduate themselves (matched by session token cookie)
 *   - staff (admin/coordinator)
 */

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { USE_SUPABASE } from "@/lib/supabase/env";
import {
  invitationEmailTemplate,
  invitationsSentConfirmationTemplate,
  sendEmail,
} from "@/lib/email";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { parseJson, SendInvitationsBody } from "@/lib/security/schemas";
import { GRADUATE_SESSION_COOKIE } from "../../auth/graduate/verify-otp/route";
import { formatDateLong, formatTime } from "@/lib/format";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ error: "mock_mode" }, { status: 501 });
  }

  // 1. Rate limit (5/min — guards against bulk email abuse)
  const rl = rateLimit(request, "send-invitations", { max: 5, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  // 2. CSRF
  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  // 3. Validate body
  const parsed = await parseJson(request, SendInvitationsBody);
  if (!parsed.ok) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { graduateId } = parsed.data;

  // ── Authorize ────────────────────────────────────────────────────
  let authorized = false;

  // Path A: staff via Supabase Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, active")
      .eq("id", user.id)
      .maybeSingle();
    if (
      profile?.active &&
      (profile.role === "admin" || profile.role === "coordinator")
    ) {
      authorized = true;
    }
  }

  // Path B: graduate himself via session-cookie token
  if (!authorized) {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(GRADUATE_SESSION_COOKIE)?.value;
    if (sessionToken) {
      const service = createServiceClient();
      const { data: gradId } = await service.rpc("graduate_from_session", {
        p_token: sessionToken,
      });
      if (gradId === graduateId) authorized = true;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // ── Fetch pending guests + parent context (via service to bypass RLS) ──
  const service = createServiceClient();
  const { data: pending, error: pErr } = await service
    .from("guests")
    .select("id, full_name, email, invitation_token")
    .eq("graduate_id", graduateId)
    .eq("status", "pending");
  if (pErr) {
    console.error("[send-invitations] fetch error:", pErr);
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
  if (!pending || pending.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 0 });
  }

  const { data: grad } = await service
    .from("graduates")
    .select("full_name, ceremony_id, ceremonies(name, date, start_time, venue, campus)")
    .eq("id", graduateId)
    .single();
  if (!grad || !grad.ceremonies) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const cer = grad.ceremonies as unknown as {
    name: string;
    date: string;
    start_time: string;
    venue: string;
    campus: string;
  };

  // ── Send emails ───────────────────────────────────────────────────
  let sent = 0;
  let skipped = 0;
  const nowIso = new Date().toISOString();

  for (const g of pending) {
    if (!g.email) {
      skipped++;
      continue;
    }
    const tpl = invitationEmailTemplate({
      guestFirstName: g.full_name.split(" ")[0] ?? g.full_name,
      graduateFullName: grad.full_name,
      ceremonyName: cer.name,
      ceremonyDate: formatDateLong(cer.date),
      ceremonyTime: formatTime(cer.start_time),
      ceremonyVenue: `${cer.venue}, ${cer.campus}`,
      invitationUrl: `${BASE_URL}/invitacion/${g.invitation_token}`,
    });
    try {
      await sendEmail({ to: g.email, ...tpl });
      sent++;
    } catch (err) {
      console.error(`[send-invitations] failed for ${g.email}:`, err);
      skipped++;
    }
  }

  // Mark them invited (whether emailed or skipped — they got a QR)
  await service
    .from("guests")
    .update({ status: "invited", invited_at: nowIso })
    .eq("graduate_id", graduateId)
    .eq("status", "pending");

  // Confirmation summary to the graduate — best effort, never blocks
  const { data: gradContact } = await service
    .from("graduates")
    .select("email, full_name")
    .eq("id", graduateId)
    .maybeSingle();
  if (gradContact?.email) {
    try {
      const confirmTpl = invitationsSentConfirmationTemplate({
        graduateName: gradContact.full_name,
        ceremonyName: cer.name,
        guests: pending.map((g) => ({ name: g.full_name, email: g.email })),
      });
      await sendEmail({ to: gradContact.email, ...confirmTpl });
    } catch (err) {
      console.error("[send-invitations] confirmation email failed:", err);
    }
  }

  return NextResponse.json({ ok: true, sent, skipped });
}
