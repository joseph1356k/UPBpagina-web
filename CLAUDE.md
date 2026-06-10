# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> ⚠ **This is Next.js 16 — not the one you know.** APIs, file conventions, and helpers changed in breaking ways from 14/15. Before writing any Next-specific code (route handlers, layouts, `cookies()`, dynamic params, middleware, etc.), consult `node_modules/next/dist/docs/` for the current shape. Notable: middleware is now `proxy.ts` at the project root, not `middleware.ts`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Next dev server with Turbopack (default port 3000) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint flat config |
| `npm run typecheck` | `tsc --noEmit` — strict TS, run this before declaring work done |

There is **no test runner configured**. Verification is `typecheck` + `lint` + `build` + manual run.

### Supabase / DB workflow

The Supabase MCP server is wired up and can apply migrations directly. When working with the DB:
- New schema changes go as a new file under `supabase/migrations/<timestamp>_<name>.sql`.
- For local-only changes via CLI: `npx supabase db push` (requires `supabase link --project-ref <ref>` once).
- Seed data: `npx supabase db seed` loads `supabase/seed.sql` (3 ceremonies, 6 graduates, 7 guests — same shapes as the mock).
- Project ref / URL / region are documented at the top of `.env.local`.

## Architecture — read this before changing data access

### The data router (`lib/data.ts`) is the single import surface

Components **must** import data functions from `@/lib/data`, never from `@/lib/mock` or `@/lib/db` directly. The router toggles between the two implementations based on `NEXT_PUBLIC_USE_SUPABASE`:

- `"true"` → server calls hit `lib/db` (Supabase queries via `@supabase/ssr`).
- anything else → in-memory mock arrays in `lib/mock/`.

Both implementations expose the **same function signatures**, so call sites never change. When adding a new query, add it to **both** `lib/mock/index.ts` and `lib/db/index.ts`, then re-export it from `lib/data.ts` via the `route()` helper.

The dynamic `import("./db")` in `lib/data.ts` uses a string variable on purpose — it defeats webpack tracing so the server-only `lib/db` never lands in a client bundle. **Do not "clean this up" into a static import.**

### Mutations from Client Components

Client components cannot call `lib/data` mutations in real mode (`lib/db` imports `next/headers`). They go through `lib/api-client.ts`, which in mock mode delegates to `lib/data` and in real mode `fetch`es the matching `/api/admin/*` route. Always add new mutations to all three places: `lib/db`, an `/api/admin/...` route handler, and `lib/api-client.ts`.

### Two auth systems, on purpose

| Who | How | Where |
|---|---|---|
| **Staff** (admin / coordinator / scanner) | Supabase Auth (email + password). Profile mirror in `public.users` with `role` + `active`. | `lib/supabase/{client,server,middleware,service}.ts`, `requireStaff()` in `lib/security/staff-auth.ts` |
| **Graduates** | Custom OTP flow — *not* in `auth.users`. 6-digit OTP emailed, hashed in `graduate_sessions`, session token returned in `upb_graduate_session` cookie. | `app/api/auth/graduate/*`, SQL functions `graduate_generate_otp` / `graduate_verify_otp` / `graduate_from_session` |

RLS only protects staff data. Graduate-scoped endpoints use the `service_role` client *and* filter by the `graduate_id` derived from the session cookie — never trust an inbound `graduate_id`.

### Atomic ops live in SQL, not the app

`SECURITY DEFINER` PostgreSQL functions handle anything race-prone:
- `validate_qr_token` — row-lock + status flip + scan_event insert in one transaction (one-time entry guarantee).
- `graduate_generate_otp` / `graduate_verify_otp` — rate-limit + bcrypt hash + session mint.
- `get_ceremony_stats` / `get_overview_stats` — efficient aggregates that bypass RLS recursion.
- `is_staff(roles[])` — used inside RLS policies; **must stay `SECURITY DEFINER`** or RLS will infinite-recurse.

`pgcrypto` lives in the `extensions` schema (Supabase convention), not `public`. Any `SECURITY DEFINER` function that uses `crypt()`, `gen_salt()`, or `gen_random_bytes()` must declare `SET search_path = public, extensions`.

### Route groups define the shells

```
app/
  (public)/    landing, /registro (OTP entry), /invitacion/[token]
  (graduate)/  /portal/* — graduate workspace (needs upb_graduate_session cookie)
  (admin)/    /admin/* — staff dashboard (sidebar shell)
  (auth)/     /admin/iniciar-sesion (staff login)
  (scanner)/  /scanner — fullscreen PWA shell, registers service worker
  api/        route handlers — each does its own auth + CSRF + rate-limit
```

`proxy.ts` (the new Next 16 name for middleware) gates `/admin/*`, `/scanner/*`, and `/portal/*` *only* when `USE_SUPABASE=true` — in mock mode everything is open so demos work without setup. API routes are not gated by `proxy.ts`; each handler calls `requireStaff()` (or the graduate-session equivalent) itself.

### Security headers are set in `next.config.ts`

CSP, HSTS, X-Frame-Options, Permissions-Policy, etc. The CSP's `connect-src` is built dynamically from `NEXT_PUBLIC_SUPABASE_URL` — if you add a new external host (analytics, etc.), update `next.config.ts` or requests will be blocked silently.

### PWA scanner

`lib/pwa/` has the offline plumbing: `scan-queue.ts` (IndexedDB FIFO), `use-online.ts` hook, `register-sw.tsx` component. `components/scanner/connection-status.tsx` polls the queue every 4s and auto-flushes via `flushQueue()` when the device returns online. Don't replace the polling with `BroadcastChannel`/events without checking whether iOS Safari fires the relevant events while backgrounded — the polling is the conservative choice.

## Conventions

- **Spanish in the UI, English in code/comments.** All user-visible copy is `es-CO`. Date/number formatting is centralized in `lib/format.ts` — do not call `toLocaleString` directly.
- **Types mirror the DB.** `lib/types.ts` is the public shape; `lib/supabase/types.ts` is the generated DB-level shape; `lib/db/mappers.ts` translates between them.
- **Tokens not hex codes.** Tailwind colors are semantic (`bg-success/15`, `text-warning`, etc.), defined in `app/globals.css` via `@theme`. Adding a literal `#...` color is a smell.
- **shadcn under `components/ui/`.** Primitives are local copies (preset `base-nova`, based on `@base-ui/react`) — edit them in place when needed, don't wrap.
- **No `next/font` for Inter/Source Serif 4** — they're loaded via Google CDN through CSS in `app/globals.css`. Check there before adding font imports.
- **Service-role key is server-only.** `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix) — `lib/supabase/service.ts` is the only entry point and is gated by `import "server-only"`.

## Things that look weird but are intentional

- The lint-disable in `components/scanner/connection-status.tsx` on `react-hooks/set-state-in-effect`. The state setter is inside a stable `useCallback`; the rule fires a false positive.
- The dynamic import path string in `lib/data.ts` (`const modulePath = "./db"; await import(modulePath)`). Static imports were leaking `lib/db` into client bundles via type-only references.
- `proxy.ts` does **not** validate the graduate session token against the DB — it only checks for cookie presence. The RSC at `/portal` validates via `graduate_from_session()` on render, which is faster overall than per-request token lookups.
- Mock and DB implementations are kept feature-parity manually. There's no codegen — if you add `getFoo` to one, add it to the other and to `lib/data.ts`.
