/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  Data router — single import point for all data access             ║
 * ╚════════════════════════════════════════════════════════════════════╝
 *
 * Components import from here instead of `lib/mock` or `lib/db`:
 *
 *     import { getCeremonies, createCeremony } from "@/lib/data";
 *
 * Behaviour is controlled by `NEXT_PUBLIC_USE_SUPABASE`:
 *   - "true"   → all calls go to the real Supabase (`lib/db`)
 *   - anything else → in-memory mock (`lib/mock`)
 *
 * Default is mock, so the app works with zero config out of the box.
 *
 * ─── Migration path ────────────────────────────────────────────────────
 *  Today: components import from `@/lib/mock` directly.
 *  Goal:  one find-and-replace from `@/lib/mock` to `@/lib/data` and
 *         flipping the env var swaps the data layer entirely.
 *
 *  The two modules expose the *exact same* function signatures —
 *  enforced by TypeScript via `satisfies` checks below.
 */

import { USE_SUPABASE } from "@/lib/supabase/env";

import * as mock from "@/lib/mock";
import type * as db from "@/lib/db";

// Compile-time shape check — if the two diverge, TS errors here.
// (We use `db` only as a type reference, never imported at runtime
// when USE_SUPABASE is false, to keep client bundles small.)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _ShapeCheck = {
  [K in keyof typeof mock]: K extends keyof typeof db
    ? (typeof mock)[K] extends (typeof db)[K]
      ? true
      : false
    : "missing-in-db";
};

// Dynamic import keeps `lib/db` (which uses next/headers) out of the
// client bundle when running in mock mode.
let _real: typeof db | null = null;
async function real(): Promise<typeof db> {
  if (_real) return _real;
  _real = (await import("@/lib/db")) as typeof db;
  return _real;
}

/* ──────────────────────────────────────────────────────────────────
   Wrap every mock function so the runtime decision happens per call.
   This keeps the bundle small (mock only) when USE_SUPABASE=false.
   ────────────────────────────────────────────────────────────────── */

type AnyFn = (...args: never[]) => unknown;

function route<K extends keyof typeof mock>(name: K): (typeof mock)[K] {
  const mockFn = mock[name] as unknown as AnyFn;
  if (typeof mockFn !== "function") {
    // Non-function exports (types/interfaces) are re-exported as-is below.
    return mock[name];
  }
  if (!USE_SUPABASE) return mock[name];

  return (async (...args: unknown[]) => {
    const real_ = await real();
    const realFn = (real_ as unknown as Record<string, AnyFn>)[name];
    if (!realFn) {
      throw new Error(
        `[data] Function "${String(name)}" is not implemented in lib/db. ` +
          `Either add it there or remove from lib/mock.`,
      );
    }
    return realFn(...(args as never[]));
  }) as unknown as (typeof mock)[K];
}

/* ──────────────────────────────────────────────────────────────────
   Read queries
   ────────────────────────────────────────────────────────────────── */

export const getCeremonies         = route("getCeremonies");
export const getCeremony           = route("getCeremony");
export const getActiveCeremonies   = route("getActiveCeremonies");
export const getNextCeremony       = route("getNextCeremony");

export const getGraduates          = route("getGraduates");
export const getGraduate           = route("getGraduate");
export const getGraduateByDocument = route("getGraduateByDocument");

export const getGuests             = route("getGuests");
export const getGuest              = route("getGuest");

export const getUsers              = route("getUsers");
export const getUser               = route("getUser");

export const getScanEvents         = route("getScanEvents");
export const getAuditLog           = route("getAuditLog");

export const getCeremonyStats      = route("getCeremonyStats");
export const getOverviewStats      = route("getOverviewStats");

/* ──────────────────────────────────────────────────────────────────
   Admin/joined queries
   ────────────────────────────────────────────────────────────────── */

export const getGuestsAdmin        = route("getGuestsAdmin");
export const getScanEventsAdmin    = route("getScanEventsAdmin");
export const getAuditLogAdmin      = route("getAuditLogAdmin");

/* ──────────────────────────────────────────────────────────────────
   Public — invitation lookup
   ────────────────────────────────────────────────────────────────── */

export const getInvitationByToken  = route("getInvitationByToken");

/* ──────────────────────────────────────────────────────────────────
   Scanner
   ────────────────────────────────────────────────────────────────── */

export const simulateScan          = route("simulateScan");

/* ──────────────────────────────────────────────────────────────────
   Mutations
   ────────────────────────────────────────────────────────────────── */

export const createCeremony        = route("createCeremony");
export const updateCeremony        = route("updateCeremony");
export const updateGraduateAdmin   = route("updateGraduateAdmin");
export const revokeGuestAdmin      = route("revokeGuestAdmin");
export const createUser            = route("createUser");
export const updateUser            = route("updateUser");

/* ──────────────────────────────────────────────────────────────────
   Type re-exports (always the same shape — no routing needed)
   ────────────────────────────────────────────────────────────────── */

export type {
  GetGraduatesArgs,
  GetGuestsArgs,
  GetScanEventsArgs,
  GetGuestsAdminArgs,
  GuestAdminRow,
  CreateCeremonyInput,
  UpdateCeremonyInput,
  CreateUserInput,
  UpdateUserInput,
  UpdateGraduateAdminInput,
  OverviewStats,
  InvitationView,
  SimulatedScanResult,
  ScanEventRow,
  AuditLogRow,
} from "@/lib/mock";
