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

/* ────────────────────────────────────────────────────────────────────
   Invitations
   ──────────────────────────────────────────────────────────────────── */

export const SendInvitationsBody = z.object({
  graduateId: z.string().trim().min(1).max(64),
});
export type SendInvitationsInput = z.infer<typeof SendInvitationsBody>;

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
