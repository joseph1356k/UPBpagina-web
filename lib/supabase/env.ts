/**
 * Centralized Supabase env-var access with friendly errors.
 *
 * The data router (`lib/data.ts`) toggles between mock and real based on
 * `NEXT_PUBLIC_USE_SUPABASE`. If you set it to `true` but forget a key,
 * we want a clear error at boot, not a cryptic "fetch failed" later.
 */

export const USE_SUPABASE =
  process.env.NEXT_PUBLIC_USE_SUPABASE === "true";

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[supabase] Missing env var ${name}. ` +
        `Set it in .env.local or your deployment environment. ` +
        `See docs/SETUP.md for the full list.`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabaseAnonKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function supabaseServiceRoleKey(): string {
  return required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
