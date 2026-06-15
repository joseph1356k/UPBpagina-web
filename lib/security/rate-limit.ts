/**
 * IP rate limiter for API routes — distributed when possible.
 *
 * Two backends, chosen automatically at runtime:
 *
 *   1. Upstash Redis (REST) — used when UPSTASH_REDIS_REST_URL and
 *      UPSTASH_REDIS_REST_TOKEN are set. Shared across all serverless
 *      instances, so the limit is global (the correct behaviour on Vercel).
 *      Fixed-window counter via INCR + EXPIRE NX. No SDK dependency — plain
 *      fetch against the REST API.
 *
 *   2. In-memory Map — fallback when no Redis creds are present (local dev,
 *      or before the user wires up Upstash). Per-process, so on Vercel each
 *      instance counts separately — weaker, but never breaks the deploy.
 *
 * If Redis is configured but unreachable, we fail over to in-memory for that
 * request rather than blocking traffic (the DB-level rate limit in
 * graduate_generate_otp is the authoritative backstop for OTP abuse).
 *
 * Usage (note: now async — `await` it):
 *
 *     const rl = await rateLimit(request, "send-otp", { max: 10, windowMs: 60_000 });
 *     if (!rl.ok) return rl.response;
 */

import "server-only";

import { NextResponse, type NextRequest } from "next/server";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_REDIS = Boolean(REDIS_URL && REDIS_TOKEN);

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

/* ────────────────────────────────────────────────────────────────────
   Redis backend (Upstash REST)
   ──────────────────────────────────────────────────────────────────── */

/**
 * Atomic INCR + (first-hit) EXPIRE via the Upstash pipeline endpoint.
 * Returns the new counter value, or null if Redis is unreachable / errored
 * (caller then falls back to in-memory).
 */
async function redisHit(
  key: string,
  windowSec: number,
): Promise<number | null> {
  try {
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      // INCR returns the new count; EXPIRE ... NX sets the TTL only on the
      // first hit, giving a true fixed window (not a sliding reset).
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSec), "NX"],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result?: unknown }>;
    const count = data?.[0]?.result;
    return typeof count === "number" ? count : null;
  } catch {
    return null; // fail over to in-memory
  }
}

/* ────────────────────────────────────────────────────────────────────
   In-memory backend
   ──────────────────────────────────────────────────────────────────── */

function memoryHit(
  key: string,
  opts: RateLimitOptions,
): { count: number; resetAt: number } {
  const now = Date.now();
  const existing = BUCKETS.get(key);
  if (!existing || existing.resetAt < now) {
    const bucket = { count: 1, resetAt: now + opts.windowMs };
    BUCKETS.set(key, bucket);
    return bucket;
  }
  existing.count += 1;
  return existing;
}

/* ────────────────────────────────────────────────────────────────────
   Public API
   ──────────────────────────────────────────────────────────────────── */

function buildResult(
  count: number,
  resetAt: number,
  opts: RateLimitOptions,
): RateLimitResult {
  const remaining = Math.max(0, opts.max - count);
  const ok = count <= opts.max;
  const now = Date.now();

  const headers = new Headers({
    "X-RateLimit-Limit": String(opts.max),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  });
  if (!ok) {
    headers.set(
      "Retry-After",
      String(Math.max(1, Math.ceil((resetAt - now) / 1000))),
    );
  }

  const response = ok
    ? NextResponse.next({ headers })
    : NextResponse.json(
        { ok: false, error: "rate_limit" },
        { status: 429, headers },
      );

  return { ok, remaining, resetAt, response };
}

/**
 * Returns `{ ok: false, response }` when the client should be blocked.
 * The response is a 429 with Retry-After + RateLimit-* headers.
 */
export async function rateLimit(
  request: NextRequest,
  scope: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const key = `${scope}:${getClientIp(request)}`;

  if (USE_REDIS) {
    const windowSec = Math.max(1, Math.ceil(opts.windowMs / 1000));
    const count = await redisHit(`rl:${key}`, windowSec);
    if (count !== null) {
      // Redis doesn't tell us the exact reset; approximate from the window.
      return buildResult(count, Date.now() + opts.windowMs, opts);
    }
    // Redis unreachable → fall through to in-memory for this request.
  }

  const bucket = memoryHit(key, opts);
  return buildResult(bucket.count, bucket.resetAt, opts);
}

/**
 * Periodic cleanup of expired in-memory buckets so the Map doesn't grow
 * unbounded. Runs every 10 minutes per Node process. (No-op for Redis.)
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
