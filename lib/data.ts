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
 *   - "true"   → server-side calls go to the real Supabase (`lib/db`)
 *   - anything else → in-memory mock (`lib/mock`)
 *
 * ⚠ Client component behaviour:
 *   - Mock mode  → works (in-browser arrays)
 *   - Real mode  → DOES NOT WORK for mutations. Client components must
 *                  call /api/* endpoints instead. Mutations from client
 *                  components will throw a clear runtime error.
 *
 * ─── Why no static import of lib/db ────────────────────────────────────
 *  lib/db transitively imports next/headers which is server-only.
 *  Even a `import type` was getting traced by webpack into client bundles.
 *  So the import is fully lazy + dynamic path string to defeat tracing.
 */

import { USE_SUPABASE } from "@/lib/supabase/env";

import * as mock from "@/lib/mock";

// Re-export types (type-only — erased at runtime, no bundle impact)
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

/* ──────────────────────────────────────────────────────────────────
   Lazy db loader — server only, defeats webpack tracing
   ────────────────────────────────────────────────────────────────── */

const isServer = typeof window === "undefined";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _real: any | null = null;

async function loadReal() {
  if (_real) return _real;
  if (!isServer) {
    throw new Error(
      "[data] Real Supabase mode is server-only. Client components " +
        "must call /api/* endpoints instead of importing from @/lib/data.",
    );
  }
  // Dynamic path string defeats webpack's static analysis so lib/db
  // never lands in client bundles. ⚠ Keep this pattern intact.
  const modulePath = "./db";
  _real = await import(/* webpackIgnore: true */ modulePath);
  return _real;
}

/* ──────────────────────────────────────────────────────────────────
   Router factory — wraps each mock function with runtime routing
   ────────────────────────────────────────────────────────────────── */

type AnyFn = (...args: never[]) => unknown;

function route<K extends keyof typeof mock>(name: K): (typeof mock)[K] {
  const mockFn = mock[name];
  if (typeof mockFn !== "function") return mockFn; // non-function exports
  if (!USE_SUPABASE) return mockFn;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (async (...args: any[]) => {
    const real = await loadReal();
    const realFn = real[name] as AnyFn | undefined;
    if (!realFn) {
      throw new Error(
        `[data] Function "${String(name)}" not implemented in lib/db.`,
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
   Mutations — note: in Supabase mode these are server-only.
   Client components must use /api/* endpoints.
   ────────────────────────────────────────────────────────────────── */

export const createCeremony        = route("createCeremony");
export const updateCeremony        = route("updateCeremony");
export const updateGraduateAdmin   = route("updateGraduateAdmin");
export const revokeGuestAdmin      = route("revokeGuestAdmin");
export const createUser            = route("createUser");
export const updateUser            = route("updateUser");
