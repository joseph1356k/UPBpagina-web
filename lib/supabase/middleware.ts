/**
 * Middleware helper — refreshes the Supabase auth cookies on every request
 * and exposes the current user so we can gate routes.
 *
 * Called from the root `middleware.ts`. Returns:
 *   - `response`  → the NextResponse to use (with refreshed cookies)
 *   - `user`      → the auth.users record, or null if anonymous
 *   - `profile`   → the public.users record (role, active), or null
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database, UserRoleDb } from "./types";
import { supabaseAnonKey, supabaseUrl, USE_SUPABASE } from "./env";

export interface SupabaseSession {
  response: NextResponse;
  userId: string | null;
  role: UserRoleDb | null;
  active: boolean;
}

export async function updateSession(
  request: NextRequest,
): Promise<SupabaseSession> {
  let response = NextResponse.next({ request });

  // When mock mode is on, skip Supabase entirely — middleware is a no-op
  // (auth-gated routes are themselves no-ops in mock mode).
  if (!USE_SUPABASE) {
    return { response, userId: null, role: null, active: false };
  }

  const supabase = createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: don't put any code between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { response, userId: null, role: null, active: false };
  }

  // Get profile (role + active) — needed to gate /admin vs /scanner
  const { data: profile } = await supabase
    .from("users")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();

  return {
    response,
    userId: user.id,
    role: profile?.role ?? null,
    active: profile?.active ?? false,
  };
}
