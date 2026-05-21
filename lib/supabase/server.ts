/**
 * Server-side Supabase client for Next.js App Router.
 *
 * - Use this in Server Components (page.tsx / layout.tsx) and Route Handlers
 *   (app/api/.../route.ts) that need to query as the *current user*.
 * - Reads the auth session from cookies and refreshes it when needed.
 * - RLS is applied — the user only sees what their role allows.
 *
 * For privileged operations (creating users, bypassing RLS), use `./service`.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./types";
import { supabaseAnonKey, supabaseUrl } from "./env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll can fail in Server Components (read-only cookie store).
          // The middleware refreshes the session, so it's safe to ignore here.
        }
      },
    },
  });
}
