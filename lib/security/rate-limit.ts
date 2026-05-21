/**
 * In-memory IP rate limiter for API routes.
 *
 * Limitations (by design):
 *   - Per-process state: doesn't share across Vercel serverless instances.
 *     For production at scale, replace with Upstash Redis / Vercel KV.
 *   - Fine for ~1000 users/month — the DB-level rate limit in the OTP
 *     function is the authoritative backstop.
 *
 * Use as the FIRST line of defense (cheap, blocks before DB call):
 *
 *     const rl = rateLimit(request, "send-otp", { max: 10, windowMs: 60_000 });
 *     if (!rl.ok) return rl.response;
 */

import "server-only";

import { NextResponse, type NextRequest } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const BUCKETS = new Map<string, Bucket>();

/**
 * Best-effort client IP. Trusts standard proxy headers in this order:
 *   1. x-forwarded-for (Vercel, Cloudflare, most CDNs)
 *   2. x-real-ip
 *   3. cf-connecting-ip (Cloudflare specific)
 *
 * Returns "unknown" if no header present — those requests all share one
 * bucket, which is the conservative behaviour.
 */
function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

export interface RateLimitOptions {
  /** Max requests in the window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  response: NextResponse;
}

/**
 * Returns `{ ok: false, response }` when the client should be blocked.
 * The response is a 429 with Retry-After + RateLimit-* headers.
 */
export function rateLimit(
  request: NextRequest,
  scope: string,
  opts: RateLimitOptions,
): RateLimitResult {
  const key = `${scope}:${getClientIp(request)}`;
  const now = Date.now();
  const existing = BUCKETS.get(key);

  let bucket: Bucket;
  if (!existing || existing.resetAt < now) {
    bucket = { count: 1, resetAt: now + opts.windowMs };
    BUCKETS.set(key, bucket);
  } else {
    existing.count += 1;
    bucket = existing;
  }

  const remaining = Math.max(0, opts.max - bucket.count);
  const ok = bucket.count <= opts.max;

  const headers = new Headers({
    "X-RateLimit-Limit": String(opts.max),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(bucket.resetAt / 1000)),
  });
  if (!ok) {
    headers.set(
      "Retry-After",
      String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))),
    );
  }

  const response = ok
    ? NextResponse.next({ headers })
    : NextResponse.json(
        { ok: false, error: "rate_limit" },
        { status: 429, headers },
      );

  return { ok, remaining, resetAt: bucket.resetAt, response };
}

/**
 * Periodic cleanup of expired buckets so the Map doesn't grow unbounded.
 * Runs every 10 minutes per Node process.
 */
declare global {
  var __rate_limit_sweep_timer: NodeJS.Timeout | undefined;
}
if (typeof window === "undefined" && !globalThis.__rate_limit_sweep_timer) {
  globalThis.__rate_limit_sweep_timer = setInterval(
    () => {
      const now = Date.now();
      for (const [k, v] of BUCKETS) {
        if (v.resetAt < now) BUCKETS.delete(k);
      }
    },
    10 * 60 * 1000,
  );
  globalThis.__rate_limit_sweep_timer.unref?.();
}
