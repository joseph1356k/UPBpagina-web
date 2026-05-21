/**
 * POST /api/auth/graduate/sign-out
 *
 * Clears the graduate session cookie.
 */

import { NextResponse } from "next/server";

import { GRADUATE_SESSION_COOKIE } from "../verify-otp/route";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(GRADUATE_SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });
  return response;
}
