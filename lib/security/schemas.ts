/**
 * Zod schemas for all request bodies hitting our API routes.
 *
 * Centralizing these means every endpoint validates the exact same way,
 * and any change to the contract is type-safe.
 */

import { z } from "zod";

/* ────────────────────────────────────────────────────────────────────
   Auth — graduate OTP
   ──────────────────────────────────────────────────────────────────── */

export const SendOtpBody = z.object({
  documentNumber: z
    .string()
    .trim()
    .transform((s) => s.replace(/\D/g, ""))
    .refine((s) => s.length >= 6 && s.length <= 12, {
      message: "documento entre 6 y 12 dígitos",
    }),
  // Cloudflare Turnstile token. Optional in the schema so the endpoint still
  // works when Turnstile is disabled; the route verifies it server-side.
  captchaToken: z.string().max(2048).optional(),
});
export type SendOtpInput = z.infer<typeof SendOtpBody>;

export const VerifyOtpBody = z.object({
  graduateId: z.string().trim().min(1).max(64),
  code: z.string().trim().regex(/^\d{6}$/, "código de 6 dígitos"),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpBody>;

/* ────────────────────────────────────────────────────────────────────
   QR scanner
   ──────────────────────────────────────────────────────────────────── */

export const QrValidateBody = z.object({
  token: z
    .string()
    .trim()
    .min(16, "token demasiado corto")
    .max(128)
    // Only accept hex/url-safe chars
    .regex(/^[a-zA-Z0-9_-]+$/, "token con caracteres inválidos"),
});
export type QrValidateInput = z.infer<typeof QrValidateBody>;

export const ManualCheckInBody = z.object({
  guestId: z.string().trim().min(1).max(64),
});
export type ManualCheckInInput = z.infer<typeof ManualCheckInBody>;

/* ────────────────────────────────────────────────────────────────────
   Public self-registration (RSVP)
   ──────────────────────────────────────────────────────────────────── */

export const RegisterAttendeeBody = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(120),
  document: z.string().trim().min(4).max(20).optional(),
  // Cloudflare Turnstile token (verified server-side; optional until wired).
  captchaToken: z.string().max(2048).optional(),
});
export type RegisterAttendeeInput = z.infer<typeof RegisterAttendeeBody>;

/* ────────────────────────────────────────────────────────────────────
   Invitations
   ──────────────────────────────────────────────────────────────────── */

export const SendInvitationsBody = z.object({
  graduateId: z.string().trim().min(1).max(64),
});
export type SendInvitationsInput = z.infer<typeof SendInvitationsBody>;

/* ────────────────────────────────────────────────────────────────────
   Admin mutations — ceremonies
   ──────────────────────────────────────────────────────────────────── */

import { EVENT_TYPE_SLUG_RE } from "@/lib/terminology";
import { EMAIL_TEMPLATE_KEYS } from "@/lib/email-templates";

const CeremonyBase = {
  name: z.string().trim().min(3).max(120),
  // Slug-format (not a closed enum) so admin-created custom types pass.
  // Existence is implicitly guaranteed by the form's select.
  eventType: z.string().trim().regex(EVENT_TYPE_SLUG_RE, "tipo inválido"),
  emailTemplate: z.enum(EMAIL_TEMPLATE_KEYS),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "fecha YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "hora HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "hora HH:MM"),
  venue: z.string().trim().min(2).max(150),
  campus: z.string().trim().min(2).max(100),
  faculty: z.string().trim().min(2).max(150),
  status: z.enum(["draft", "open", "closed", "in_progress", "completed"]),
  maxGuestsDefault: z.number().int().min(1).max(20),
  // Venue capacity (aforo). null = no limit. Lenient input, defined output.
  capacity: z.number().int().positive().max(100000).nullable().default(null),
  // Public catalog opt-in. Lenient input, defined output.
  publicListed: z.boolean().optional().default(false),
  registrationClosesAt: z.string().min(10).max(40),
  customData: z.record(z.string(), z.string().max(500)).optional().default({}),
};

export const CreateCeremonyBody = z.object(CeremonyBase);
export const UpdateCeremonyBody = z.object(CeremonyBase).partial();
export type CreateCeremonyBodyT = z.infer<typeof CreateCeremonyBody>;
export type UpdateCeremonyBodyT = z.infer<typeof UpdateCeremonyBody>;

export const SetOrganizersBody = z.object({
  userIds: z.array(z.string().trim().min(1).max(64)).max(50),
});
export type SetOrganizersBodyT = z.infer<typeof SetOrganizersBody>;

/* ────────────────────────────────────────────────────────────────────
   Admin mutations — users
   ──────────────────────────────────────────────────────────────────── */

export const CreateUserBody = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  role: z.enum(["admin", "scanner", "coordinator", "organizer"]),
  active: z.boolean(),
});

export const UpdateUserBody = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().toLowerCase().email().max(120).optional(),
  role: z.enum(["admin", "scanner", "coordinator", "organizer"]).optional(),
  active: z.boolean().optional(),
});
export type CreateUserBodyT = z.infer<typeof CreateUserBody>;
export type UpdateUserBodyT = z.infer<typeof UpdateUserBody>;

/* ────────────────────────────────────────────────────────────────────
   Admin mutations — graduates
   ──────────────────────────────────────────────────────────────────── */

export const UpdateGraduateBody = z.object({
  documentType: z.enum(["CC", "CE", "TI", "PP"]).optional(),
  documentNumber: z.string().trim().min(6).max(15).optional(),
  studentCode: z.string().trim().min(3).max(20).optional(),
  fullName: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().toLowerCase().email().max(120).optional(),
  program: z.string().trim().min(2).max(150).optional(),
  faculty: z.string().trim().min(2).max(150).optional(),
  maxGuests: z.number().int().min(0).max(20).optional(),
  status: z
    .enum(["eligible", "not_eligible", "registered", "completed"])
    .optional(),
});
export type UpdateGraduateBodyT = z.infer<typeof UpdateGraduateBody>;

/* ────────────────────────────────────────────────────────────────────
   Helper — parse + collapse errors
   ──────────────────────────────────────────────────────────────────── */

/**
 * Parses an unknown body against a schema and returns either the parsed
 * value or a flat error message safe to expose to the client.
 *
 *     const r = await parseJson(request, VerifyOtpBody);
 *     if (!r.ok) return NextResponse.json({ ok:false, error:r.error }, { status:400 });
 *     const { graduateId, code } = r.data;
 */
export async function parseJson<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<
  { ok: true; data: z.infer<T> } | { ok: false; error: string }
> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, error: "invalid_json" };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: first ? `${first.path.join(".")}: ${first.message}` : "invalid_body",
    };
  }
  return { ok: true, data: parsed.data };
}
