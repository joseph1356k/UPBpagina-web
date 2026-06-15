/**
 * Next.js 16 Proxy (formerly Middleware).
 *
 * Three jobs:
 *   1. Refresh Supabase auth cookies (so server components see fresh session)
 *   2. Gate /admin/* and /scanner/* to authenticated staff
 *   3. Gate /portal/* to graduates with a valid session cookie
 *
 * Behaviour is a no-op when NEXT_PUBLIC_USE_SUPABASE is not "true",
 * so the mock-mode app stays open (which is the dev default and intended
 * for demos — production must run with USE_SUPABASE=true).
 */

import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { USE_SUPABASE } from "@/lib/supabase/env";

const ADMIN_PREFIX = "/admin";
const SCANNER_PREFIX = "/scanner";
const PORTAL_PREFIX = "/portal";
const STAFF_LOGIN = "/admin/iniciar-sesion";
const GRADUATE_LOGIN = "/registro";
const GRADUATE_SESSION_COOKIE = "upb_graduate_session";

export async function proxy(request: NextRequest) {
  // Always refresh the Supabase session cookies (returns NextResponse.next()
  // when in mock mode).
  const { response, userId, role, active } = await updateSession(request);

  if (!USE_SUPABASE) return response;

  const path = request.nextUrl.pathname;

  // Public routes — always allow through
  if (
    path === "/" ||
    path === STAFF_LOGIN ||
    path === GRADUATE_LOGIN ||
    path.startsWith("/api/") ||           // routes do their own auth
    path.startsWith("/_next/") ||
    path.startsWith("/registro") ||
    path.startsWith("/invitacion") ||     // public invitation viewer
    path.startsWith("/dev/")              // local dev only — strip in prod
  ) {
    return response;
  }

  // ── /admin/* — staff only (admin/coordinator/organizer + active) ────
  // Organizers reach /admin but RLS scopes them to their assigned events.
  if (path.startsWith(ADMIN_PREFIX)) {
    if (
      !userId ||
      !active ||
      (role !== "admin" && role !== "coordinator" && role !== "organizer")
    ) {
      return redirectToLogin(request, STAFF_LOGIN, path);
    }
    return response;
  }

  // ── /scanner/* — staff (admin/coordinator/scanner + active) ─────────
  if (path.startsWith(SCANNER_PREFIX)) {
    if (
      !userId ||
      !active ||
      (role !== "scanner" && role !== "coordinator" && role !== "admin")
    ) {
      return redirectToLogin(request, STAFF_LOGIN, path);
    }
    return response;
  }

  // ── /portal/* — graduate session cookie required ────────────────────
  if (path.startsWith(PORTAL_PREFIX)) {
    const sessionToken = request.cookies.get(GRADUATE_SESSION_COOKIE)?.value;
    if (!sessionToken) {
      return redirectToLogin(request, GRADUATE_LOGIN, path);
    }
    // We don't validate the token against the DB here (would add latency to
    // every request); the page-level RSC validates via graduate_from_session()
    // when it loads. Missing/expired cookie → API returns 401 → page redirects.
    return response;
  }

  return response;
}

function redirectToLogin(
  request: NextRequest,
  loginPath: string,
  originalPath: string,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = loginPath;
  url.search = ""; // drop any leaked search params
  url.searchParams.set("redirect", originalPath);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match every path EXCEPT:
     *   - _next/static, _next/image (build assets)
     *   - favicon, sitemap, robots, manifest, icon files
     *   - any .* file extension
     *
     * api routes are NOT excluded here — they pass through but each route
     * handler does its own auth + csrf + rate-limit checks.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|.*\\..*).*)",
  ],
};
