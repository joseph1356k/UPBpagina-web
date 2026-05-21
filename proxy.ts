/**
 * Next.js 16 Proxy (formerly Middleware).
 *
 * Runs before every page render. Two jobs:
 *
 *   1. Refresh Supabase auth cookies (so server components see fresh session)
 *   2. Gate /admin/* and /scanner/* to authenticated staff
 *
 * Behaviour is a no-op when NEXT_PUBLIC_USE_SUPABASE is not "true",
 * so the mock-mode app stays fully open (which is the dev default).
 */

import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { USE_SUPABASE } from "@/lib/supabase/env";

const ADMIN_PREFIX = "/admin";
const SCANNER_PREFIX = "/scanner";
const STAFF_LOGIN = "/admin/iniciar-sesion";

export async function proxy(request: NextRequest) {
  // Always refresh the Supabase session cookies (returns NextResponse.next()
  // when in mock mode).
  const { response, userId, role, active } = await updateSession(request);

  if (!USE_SUPABASE) return response;

  const path = request.nextUrl.pathname;

  // Allow API + static + the login page itself through without checks
  if (
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    path === STAFF_LOGIN ||
    path === "/" ||
    path.startsWith("/registro") ||
    path.startsWith("/invitacion") ||
    path.startsWith("/portal")
  ) {
    return response;
  }

  // Admin area — must be admin or coordinator (active)
  if (path.startsWith(ADMIN_PREFIX)) {
    if (!userId || !active || (role !== "admin" && role !== "coordinator")) {
      const url = request.nextUrl.clone();
      url.pathname = STAFF_LOGIN;
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
  }

  // Scanner area — must be scanner / coordinator / admin (active)
  if (path.startsWith(SCANNER_PREFIX)) {
    if (
      !userId ||
      !active ||
      (role !== "scanner" && role !== "coordinator" && role !== "admin")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = STAFF_LOGIN;
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match every path EXCEPT:
     *   - api routes (handled by route handlers)
     *   - _next/static, _next/image (build assets)
     *   - favicon, sitemap, robots
     *   - any .* file (icons, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
