"use client";

/**
 * Browser Supabase client.
 *
 * Use this in Client Components ("use client") that need to query the
 * database or call auth methods directly from the browser.
 *
 * For Server Components / Route Handlers, import from `./server` instead.
 */

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./types";
import { supabaseAnonKey, supabaseUrl } from "./env";

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (_client) return _client;
  _client = createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
  return _client;
}
