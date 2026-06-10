/**
 * Server helper — validate the graduate session cookie and return the
 * graduateId we should scope queries to.
 *
 * Pattern is identical to staff-auth.ts but for the graduate flow:
 * cookie → SQL function → graduateId. The caller MUST filter all queries
 * by that id; never trust an inbound graduateId from the request.
 */

import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";

export const GRADUATE_SESSION_COOKIE = "upb_graduate_session";

export type GraduateAuthOk = {
  ok: true;
  graduateId: string;
};

export type GraduateAuthFail = {
  ok: false;
  response: NextResponse;
};

export async function requireGraduate(): Promise<
  GraduateAuthOk | GraduateAuthFail
> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(GRADUATE_SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      ),
    };
  }

  const service = createServiceClient();
  const { data, error } = await service.rpc("graduate_from_session", {
    p_token: sessionToken,
  });

  if (error) {
    console.error("[graduate-auth] rpc error:", error.message);
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "session_check_failed" },
        { status: 500 },
      ),
    };
  }

  const graduateId = (data ?? null) as string | null;
  if (!graduateId) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "session_expired" },
        { status: 401 },
      ),
    };
  }

  return { ok: true, graduateId };
}
