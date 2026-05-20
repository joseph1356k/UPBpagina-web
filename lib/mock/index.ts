/**
 * Public mock data API.
 *
 * Every function returns a Promise to mirror what the production data
 * layer (Supabase) will look like — that way components written today
 * keep working when we swap to real queries.
 *
 * Do NOT import the underlying seed arrays directly from components.
 * Use these accessors so the swap is a one-file change later.
 */

import type {
  AuditEntry,
  Ceremony,
  CeremonyStats,
  Graduate,
  GraduateStatus,
  Guest,
  GuestStatus,
  ScanEvent,
  ScanResult,
  User,
} from "../types";

import { auditLog as auditLogSeed } from "./audit-log";
import { ceremonies as ceremoniesSeed } from "./ceremonies";
import { delay } from "./_helpers";
import { graduates as graduatesSeed } from "./graduates";
import { guests as guestsSeed } from "./guests";
import { scanEvents as scanEventsSeed } from "./scan-events";
import { users as usersSeed } from "./users";

/* ------------------------------------------------------------------ */
/*  Ceremonies                                                        */
/* ------------------------------------------------------------------ */

export async function getCeremonies(): Promise<Ceremony[]> {
  await delay();
  return [...ceremoniesSeed].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getCeremony(id: string): Promise<Ceremony | null> {
  await delay();
  return ceremoniesSeed.find((c) => c.id === id) ?? null;
}

export async function getActiveCeremonies(): Promise<Ceremony[]> {
  await delay();
  return ceremoniesSeed.filter(
    (c) => c.status === "open" || c.status === "in_progress",
  );
}

export async function getNextCeremony(): Promise<Ceremony | null> {
  await delay();
  const upcoming = ceremoniesSeed
    .filter((c) => c.status === "open" || c.status === "in_progress")
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] ?? null;
}

/* ------------------------------------------------------------------ */
/*  Graduates                                                         */
/* ------------------------------------------------------------------ */

export interface GetGraduatesArgs {
  ceremonyId?: string;
  status?: GraduateStatus;
  query?: string;
  limit?: number;
}

export async function getGraduates(
  args: GetGraduatesArgs = {},
): Promise<Graduate[]> {
  await delay();
  let result = [...graduatesSeed];
  if (args.ceremonyId) {
    result = result.filter((g) => g.ceremonyId === args.ceremonyId);
  }
  if (args.status) {
    result = result.filter((g) => g.status === args.status);
  }
  if (args.query) {
    const q = args.query.toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    result = result.filter((g) => {
      if (g.fullName.toLowerCase().includes(q)) return true;
      if (g.email.toLowerCase().includes(q)) return true;
      if (g.studentCode.includes(q)) return true;
      if (qDigits && g.documentNumber.includes(qDigits)) return true;
      return false;
    });
  }
  if (args.limit) result = result.slice(0, args.limit);
  return result;
}

export async function getGraduate(id: string): Promise<Graduate | null> {
  await delay();
  return graduatesSeed.find((g) => g.id === id) ?? null;
}

export async function getGraduateByDocument(args: {
  documentNumber: string;
  ceremonyId?: string;
}): Promise<Graduate | null> {
  await delay();
  const cleaned = args.documentNumber.replace(/\D/g, "");
  return (
    graduatesSeed.find(
      (g) =>
        g.documentNumber === cleaned &&
        (args.ceremonyId ? g.ceremonyId === args.ceremonyId : true),
    ) ?? null
  );
}

/* ------------------------------------------------------------------ */
/*  Guests                                                            */
/* ------------------------------------------------------------------ */

export interface GetGuestsArgs {
  graduateId?: string;
  ceremonyId?: string;
  status?: GuestStatus;
  limit?: number;
}

export async function getGuests(args: GetGuestsArgs = {}): Promise<Guest[]> {
  await delay();
  let result = [...guestsSeed];
  if (args.graduateId) {
    result = result.filter((g) => g.graduateId === args.graduateId);
  } else if (args.ceremonyId) {
    const gradIds = new Set(
      graduatesSeed
        .filter((g) => g.ceremonyId === args.ceremonyId)
        .map((g) => g.id),
    );
    result = result.filter((g) => gradIds.has(g.graduateId));
  }
  if (args.status) {
    result = result.filter((g) => g.status === args.status);
  }
  if (args.limit) result = result.slice(0, args.limit);
  return result;
}

export async function getGuest(id: string): Promise<Guest | null> {
  await delay();
  return guestsSeed.find((g) => g.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Users                                                             */
/* ------------------------------------------------------------------ */

export async function getUsers(): Promise<User[]> {
  await delay();
  return [...usersSeed];
}

export async function getUser(id: string): Promise<User | null> {
  await delay();
  return usersSeed.find((u) => u.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Scan events                                                       */
/* ------------------------------------------------------------------ */

export interface GetScanEventsArgs {
  result?: ScanResult;
  limit?: number;
}

export async function getScanEvents(
  args: GetScanEventsArgs = {},
): Promise<ScanEvent[]> {
  await delay();
  let result = [...scanEventsSeed];
  if (args.result) result = result.filter((e) => e.result === args.result);
  if (args.limit) result = result.slice(0, args.limit);
  return result;
}

/* ------------------------------------------------------------------ */
/*  Audit log                                                         */
/* ------------------------------------------------------------------ */

export async function getAuditLog(
  args: { limit?: number } = {},
): Promise<AuditEntry[]> {
  await delay();
  const sorted = [...auditLogSeed].sort((a, b) => b.at.localeCompare(a.at));
  return args.limit ? sorted.slice(0, args.limit) : sorted;
}

/* ------------------------------------------------------------------ */
/*  Aggregates                                                        */
/* ------------------------------------------------------------------ */

export async function getCeremonyStats(
  ceremonyId: string,
): Promise<CeremonyStats> {
  await delay();
  const gs = graduatesSeed.filter((g) => g.ceremonyId === ceremonyId);
  const gradIds = new Set(gs.map((g) => g.id));
  const gsts = guestsSeed.filter((g) => gradIds.has(g.graduateId));

  return {
    ceremonyId,
    graduatesCount: gs.length,
    graduatesRegistered: gs.filter(
      (g) => g.status === "registered" || g.status === "completed",
    ).length,
    guestsCount: gsts.length,
    guestsInvited: gsts.filter(
      (g) => g.status === "invited" || g.status === "checked_in",
    ).length,
    guestsCheckedIn: gsts.filter((g) => g.status === "checked_in").length,
    cuposTotal: gs.reduce((s, g) => s + g.maxGuests, 0),
    cuposUsed: gsts.filter((g) => g.status !== "revoked").length,
  };
}

export interface OverviewStats {
  totalCeremonies: number;
  activeCeremonies: number;
  totalGraduates: number;
  graduatesRegistered: number;
  totalGuestsInvited: number;
  totalCheckedIn: number;
  scanEventsLast24h: number;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  await delay();
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  return {
    totalCeremonies: ceremoniesSeed.length,
    activeCeremonies: ceremoniesSeed.filter(
      (c) => c.status === "open" || c.status === "in_progress",
    ).length,
    totalGraduates: graduatesSeed.length,
    graduatesRegistered: graduatesSeed.filter(
      (g) => g.status === "registered" || g.status === "completed",
    ).length,
    totalGuestsInvited: guestsSeed.filter(
      (g) => g.status === "invited" || g.status === "checked_in",
    ).length,
    totalCheckedIn: guestsSeed.filter((g) => g.status === "checked_in").length,
    scanEventsLast24h: scanEventsSeed.filter(
      (e) => new Date(e.scannedAt).getTime() > dayAgo,
    ).length,
  };
}
