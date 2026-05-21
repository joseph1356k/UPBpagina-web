/**
 * Lightweight CSRF protection via Origin / Sec-Fetch-Site headers.
 *
 * The graduate session cookie is already `SameSite=Lax`, which blocks
 * cross-origin POSTs for most browsers. This is defense-in-depth for
 * older browsers and for state-changing GET prevention.
 *
 * Strategy: reject any state-changing request whose Origin does not
 * match the app's origin AND whose Sec-Fetch-Site is neither absent
 * nor "same-origin".
 *
 * Usage at the top of a POST/PUT/PATCH/DELETE handler:
 *
 *     const csrf = assertSameOrigin(request);
 *     if (!csrf.ok) return csrf.response;
 */

import "server-only";

import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_ORIGINS = new Set<string>([
  // Always allow the configured app URL
  ...(process.env.NEXT_PUBLIC_APP_URL
    ? [process.env.NEXT_PUBLIC_APP_URL]
    : []),
  // Always allow localhost in dev
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:3000", "http://127.0.0.1:3000"]
    : []),
  // Vercel preview deployments — accept the same host the request is hitting
  // (handled dynamically below)
]);

export interface CsrfResult {
  ok: boolean;
  response: NextResponse;
}

export function assertSameOrigin(request: NextRequest): CsrfResult {
  // 1) Hard block dangerous Sec-Fetch-Site values
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return reject(`Sec-Fetch-Site: ${fetchSite}`);
  }

  // 2) If Origin is present, it must be in the allowlist or match host
  const origin = request.headers.get("origin");
  if (origin) {
    const requestHost = request.headers.get("host");
    const sameHost = requestHost
      ? origin === `https://${requestHost}` || origin === `http://${requestHost}`
      : false;
    if (!ALLOWED_ORIGINS.has(origin) && !sameHost) {
      return reject(`Origin not allowed: ${origin}`);
    }
  }

  // 3) Referer fallback (older browsers don't send Origin on same-origin POSTs)
  if (!origin) {
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        const url = new URL(referer);
        const requestHost = request.headers.get("host");
        if (requestHost && url.host !== requestHost) {
          return reject(`Referer host mismatch: ${url.host} vs ${requestHost}`);
        }
      } catch {
        return reject("Invalid referer");
      }
    }
  }

  return {
    ok: true,
    response: NextResponse.next(),
  };
}

function reject(reason: string): CsrfResult {
  // Don't expose the reason to the client — log server-side
  console.warn(`[csrf] blocked request — ${reason}`);
  return {
    ok: false,
    response: NextResponse.json(
      { ok: false, error: "csrf_check_failed" },
      { status: 403 },
    ),
  };
}
