import path from "node:path";
import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 *
 * Aligns with OWASP A05 (Security Misconfiguration) and Mozilla
 * Observatory recommendations. Tuned for an institutional app with
 * server-rendered Next.js (no inline scripts, no iframes, no eval).
 *
 * CSP notes:
 *   - `script-src 'self' 'unsafe-inline'` — Next.js inlines small
 *     hydration shims; this is the minimum without nonces.
 *     TODO: migrate to nonce-based CSP once we have a clean baseline.
 *   - `img-src` includes `data:` for inline SVG icons (lucide-react).
 *   - `connect-src` allows the configured Supabase URL + Resend API.
 */
const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : "";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self'${SUPABASE_HOST ? " " + SUPABASE_HOST + " wss://" + SUPABASE_HOST.replace(/^https?:\/\//, "") : ""}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP_DIRECTIVES },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root to this directory so a stray lockfile
  // higher in the path doesn't confuse multi-lockfile detection.
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Don't expose Next.js version in X-Powered-By header
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
