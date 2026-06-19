/**
 * Cloudflare Turnstile verification (server-side).
 *
 * Turnstile is an invisible/low-friction CAPTCHA. We verify the client token
 * against Cloudflare before processing sensitive public requests (graduate
 * OTP), to cut off bots and document-number enumeration.
 *
 * Graceful by design:
 *   - No TURNSTILE_SECRET_KEY set  → verification is skipped (returns ok).
 *     This keeps the deploy working before the user wires up Turnstile.
 *   - Cloudflare unreachable        → fail-open (returns ok). Availability
 *     wins here; the IP + DB rate limits remain the hard backstop.
 *   - Token missing / invalid       → fail-closed (returns !ok).
 *
 * To activate: create a Turnstile widget at https://dash.cloudflare.com,
 * then set NEXT_PUBLIC_TURNSTILE_SITE_KEY (client) and TURNSTILE_SECRET_KEY
 * (server) in the environment.
 */

import "server-only";

const SECRET = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface CaptchaResult {
  ok: boolean;
  /** True when verification was skipped because Turnstile isn't configured. */
  skipped?: boolean;
}

/**
 * Verifies a Turnstile token. Pass the client's IP for extra signal.
 */
export async function verifyTurnstile(
  token: string | undefined | null,
  ip?: string | null,
): Promise<CaptchaResult> {
  // Not configured → no-op (deploy stays green until the user adds keys).
  if (!SECRET) return { ok: true, skipped: true };

  // Configured but no token (or the client widget reported "skip") → block.
  if (!token || token === "skip") return { ok: false };

  try {
    const form = new URLSearchParams();
    form.set("secret", SECRET);
    form.set("response", token);
    if (ip) form.set("remoteip", ip);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    // Infrastructure error (Cloudflare down / network) → fail-open.
    if (!res.ok) return { ok: true, skipped: true };

    const data = (await res.json()) as { success?: boolean };
    return { ok: Boolean(data.success) };
  } catch {
    // Network/timeout → fail-open; rate limits remain the backstop.
    return { ok: true, skipped: true };
  }
}
