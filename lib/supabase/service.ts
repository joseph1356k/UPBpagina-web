/**
 * Service-role Supabase client — bypasses RLS.
 *
 * ⚠ NEVER import this from a Client Component or expose it to the browser.
 * Only Route Handlers, Server Actions, or background jobs should use it.
 *
 * Use cases:
 *   - Calling SECURITY DEFINER functions that need the service role
 *   - Provisioning auth.users (admin invites)
 *   - Reading audit_log
 *   - Anything that bypasses RLS by design
 */

import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";
import { supabaseServiceRoleKey, supabaseUrl } from "./env";

let _client: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createServiceClient() {
  if (_client) return _client;
  _client = createSupabaseClient<Database>(
    supabaseUrl(),
    supabaseServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
  return _client;
}
