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
 * ⚠ This module is **server-only** (because lib/db is). Client components
 *   must import types only via `import type` syntax, and call /api/*
 *   endpoints for mutations. Use lib/api-client for the client side.
 *
 * ─── History ──────────────────────────────────────────────────────────
 *  Previous versions of this file used a runtime `await import(stringVar)`
 *  trick to defeat webpack's static analysis. Turbopack (Next 16's default
 *  bundler) doesn't honour that pattern and fails to resolve the module at
 *  request time. The current approach is: static import lib/db, mark the
 *  whole file as "server-only" so we get a clean error if anything client-
 *  side tries to use it at runtime. Type-only imports work fine in client
 *  code because TS erases them.
 */

import "server-only";

import * as db from "@/lib/db";
import * as mock from "@/lib/mock";
import { USE_SUPABASE } from "@/lib/supabase/env";

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
  BulkGraduateInput,
  BulkImportResult,
  GuestSearchRow,
  RegisterAttendeeResult,
  ManifestEntry,
  ScanManifest,
} from "@/lib/mock";

/* ──────────────────────────────────────────────────────────────────
   Router factory — picks mock or db at module-load time per key
   ────────────────────────────────────────────────────────────────── */

function route<K extends keyof typeof mock>(name: K): (typeof mock)[K] {
  const mockFn = mock[name];
  if (typeof mockFn !== "function") return mockFn; // non-function exports
  if (!USE_SUPABASE) return mockFn;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realFn = (db as any)[name];
  if (typeof realFn !== "function") {
    throw new Error(
      `[data] Function "${String(name)}" not implemented in lib/db.`,
    );
  }
  return realFn as (typeof mock)[K];
}

/* ──────────────────────────────────────────────────────────────────
   Read queries
   ────────────────────────────────────────────────────────────────── */

export const getCeremonies         = route("getCeremonies");
export const getCeremony           = route("getCeremony");
export const getActiveCeremonies   = route("getActiveCeremonies");
export const getNextCeremony       = route("getNextCeremony");
export const getPublicEvents       = route("getPublicEvents");

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

export const getEventTypes         = route("getEventTypes");
export const getEventOrganizerIds  = route("getEventOrganizerIds");

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
export const searchCeremonyGuests  = route("searchCeremonyGuests");
export const manualCheckIn         = route("manualCheckIn");
export const registerAttendee      = route("registerAttendee");
export const getScanManifest       = route("getScanManifest");

/* ──────────────────────────────────────────────────────────────────
   Mutations — server-only. Client components use lib/api-client.
   ────────────────────────────────────────────────────────────────── */

export const createCeremony        = route("createCeremony");
export const updateCeremony        = route("updateCeremony");
export const updateGraduateAdmin   = route("updateGraduateAdmin");
export const revokeGuestAdmin      = route("revokeGuestAdmin");
export const createUser            = route("createUser");
export const updateUser            = route("updateUser");
export const bulkCreateGraduates   = route("bulkCreateGraduates");
export const setEventOrganizers    = route("setEventOrganizers");
