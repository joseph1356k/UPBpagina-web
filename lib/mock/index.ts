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
  ScanDeniedReason,
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

/* ------------------------------------------------------------------ */
/*  Admin-specific joined queries                                     */
/* ------------------------------------------------------------------ */

export interface GuestAdminRow extends Guest {
  graduateName: string;
  graduateProgram: string;
  ceremonyId: string;
  ceremonyName: string;
}

export interface GetGuestsAdminArgs {
  ceremonyId?: string;
  status?: GuestStatus;
  query?: string;
}

export async function getGuestsAdmin(
  args: GetGuestsAdminArgs = {},
): Promise<GuestAdminRow[]> {
  await delay();

  let result: GuestAdminRow[] = guestsSeed.map((g) => {
    const grad = graduatesSeed.find((gr) => gr.id === g.graduateId);
    const cer = grad
      ? ceremoniesSeed.find((c) => c.id === grad.ceremonyId)
      : undefined;
    return {
      ...g,
      graduateName: grad?.fullName ?? "—",
      graduateProgram: grad?.program ?? "—",
      ceremonyId: grad?.ceremonyId ?? "",
      ceremonyName: cer?.name ?? "—",
    };
  });

  if (args.ceremonyId) {
    result = result.filter((g) => g.ceremonyId === args.ceremonyId);
  }
  if (args.status) {
    result = result.filter((g) => g.status === args.status);
  }
  if (args.query) {
    const q = args.query.toLowerCase();
    result = result.filter(
      (g) =>
        g.fullName.toLowerCase().includes(q) ||
        g.graduateName.toLowerCase().includes(q) ||
        (g.documentNumber ?? "").includes(q) ||
        (g.email ?? "").toLowerCase().includes(q),
    );
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  Mutations (in-memory — for mock purposes only)                    */
/* ------------------------------------------------------------------ */

export type CreateCeremonyInput = Omit<
  Ceremony,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateCeremonyInput = Partial<Omit<Ceremony, "id" | "createdAt">>;

export async function createCeremony(
  data: CreateCeremonyInput,
): Promise<Ceremony> {
  await delay();
  const c: Ceremony = {
    ...data,
    id: `cer_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  ceremoniesSeed.push(c);
  return c;
}

export async function updateCeremony(
  id: string,
  patch: UpdateCeremonyInput,
): Promise<Ceremony> {
  await delay();
  const idx = ceremoniesSeed.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Ceremonia no encontrada");
  const updated: Ceremony = {
    ...ceremoniesSeed[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  ceremoniesSeed[idx] = updated;
  return updated;
}

export type CreateUserInput = Omit<User, "id" | "createdAt" | "lastSignInAt">;
export type UpdateUserInput = Partial<Omit<User, "id" | "createdAt">>;

export async function createUser(data: CreateUserInput): Promise<User> {
  await delay();
  const u: User = {
    ...data,
    id: `usr_${Date.now()}`,
    lastSignInAt: null,
    createdAt: new Date().toISOString(),
  };
  usersSeed.push(u);
  return u;
}

export async function updateUser(
  id: string,
  patch: UpdateUserInput,
): Promise<User> {
  await delay();
  const idx = usersSeed.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error("Usuario no encontrado");
  const updated: User = { ...usersSeed[idx], ...patch };
  usersSeed[idx] = updated;
  return updated;
}

export type UpdateGraduateAdminInput = Partial<
  Omit<Graduate, "id" | "ceremonyId" | "createdAt">
>;

export async function updateGraduateAdmin(
  id: string,
  patch: UpdateGraduateAdminInput,
): Promise<Graduate> {
  await delay();
  const idx = graduatesSeed.findIndex((g) => g.id === id);
  if (idx === -1) throw new Error("Graduando no encontrado");
  const updated: Graduate = {
    ...graduatesSeed[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  graduatesSeed[idx] = updated;
  return updated;
}

/* ------------------------------------------------------------------ */
/*  Bulk import (used by /api/admin/graduates/import)                 */
/* ------------------------------------------------------------------ */

export interface BulkGraduateInput {
  documentType: Graduate["documentType"];
  documentNumber: string;
  studentCode: string;
  fullName: string;
  email: string;
  program: string;
  faculty: string;
  maxGuests?: number | null;
  status?: Graduate["status"];
}

export interface BulkImportResult {
  inserted: number;
  skipped: number;
  errors: Array<{ documentNumber: string; reason: string }>;
}

export async function bulkCreateGraduates(
  ceremonyId: string,
  rows: BulkGraduateInput[],
): Promise<BulkImportResult> {
  await delay();
  const ceremony = ceremoniesSeed.find((c) => c.id === ceremonyId);
  if (!ceremony) throw new Error("ceremony_not_found");

  let inserted = 0;
  let skipped = 0;
  for (const row of rows) {
    const dup = graduatesSeed.some(
      (g) =>
        g.ceremonyId === ceremonyId &&
        g.documentNumber === row.documentNumber,
    );
    if (dup) {
      skipped++;
      continue;
    }
    const now = new Date().toISOString();
    graduatesSeed.push({
      id: `grad_mock_${Date.now()}_${inserted}`,
      ceremonyId,
      documentType: row.documentType,
      documentNumber: row.documentNumber,
      studentCode: row.studentCode || row.documentNumber,
      fullName: row.fullName,
      email: row.email,
      program: row.program,
      faculty: row.faculty,
      maxGuests:
        row.maxGuests !== null && row.maxGuests !== undefined && !isNaN(row.maxGuests)
          ? row.maxGuests
          : ceremony.maxGuestsDefault,
      status: row.status ?? "eligible",
      createdAt: now,
      updatedAt: now,
    });
    inserted++;
  }
  return { inserted, skipped, errors: [] };
}

/* ------------------------------------------------------------------ */
/*  Invitation token lookup                                           */
/* ------------------------------------------------------------------ */

export interface InvitationView {
  guest: Guest;
  graduate: Graduate;
  ceremony: Ceremony;
  /** Reason the QR cannot be used right now, if any. */
  blocked?: "revoked" | "ceremony_completed";
}

export async function getInvitationByToken(
  token: string,
): Promise<InvitationView | null> {
  await delay();
  const guest = guestsSeed.find((g) => g.invitationToken === token);
  if (!guest) return null;
  const graduate = graduatesSeed.find((g) => g.id === guest.graduateId);
  if (!graduate) return null;
  const ceremony = ceremoniesSeed.find((c) => c.id === graduate.ceremonyId);
  if (!ceremony) return null;

  let blocked: InvitationView["blocked"];
  if (guest.status === "revoked") blocked = "revoked";
  else if (ceremony.status === "completed" && guest.status !== "checked_in")
    blocked = "ceremony_completed";

  return { guest, graduate, ceremony, blocked };
}

/* ------------------------------------------------------------------ */
/*  Scanner simulation                                                 */
/* ------------------------------------------------------------------ */

export interface SimulatedScanResult {
  result: ScanResult;
  reason: ScanDeniedReason | null;
  guest: Guest | null;
  graduate: Graduate | null;
  ceremonyName: string | null;
  scanEvent: ScanEvent;
}

/**
 * Picks a random "candidate" guest and produces a realistic scan outcome:
 *   - 70% allowed  (status changes to checked_in, event recorded)
 *   - 15% already_used (guest was already checked in)
 *   - 10% revoked
 *   -  5% not_found  (unknown token simulated)
 */
export async function simulateScan(args: {
  scannedByUserId: string;
  ceremonyId?: string;
}): Promise<SimulatedScanResult> {
  await delay();
  const now = new Date().toISOString();
  const r = Math.random();

  // Pool of guests filtered by ceremony if requested
  const ceremonyGradIds = args.ceremonyId
    ? new Set(
        graduatesSeed
          .filter((g) => g.ceremonyId === args.ceremonyId)
          .map((g) => g.id),
      )
    : null;
  const inPool = (g: Guest) =>
    ceremonyGradIds ? ceremonyGradIds.has(g.graduateId) : true;

  let result: ScanResult = "allowed";
  let reason: ScanDeniedReason | null = null;
  let guest: Guest | null = null;

  if (r < 0.05) {
    // not_found: simulate unknown token
    result = "denied";
    reason = "not_found";
  } else if (r < 0.15) {
    // revoked
    const candidates = guestsSeed.filter(
      (g) => g.status === "revoked" && inPool(g),
    );
    guest =
      candidates[Math.floor(Math.random() * candidates.length)] ?? null;
    if (guest) {
      result = "denied";
      reason = "revoked";
    } else {
      result = "denied";
      reason = "not_found";
    }
  } else if (r < 0.3) {
    // already_used
    const candidates = guestsSeed.filter(
      (g) => g.status === "checked_in" && inPool(g),
    );
    guest =
      candidates[Math.floor(Math.random() * candidates.length)] ?? null;
    if (guest) {
      result = "denied";
      reason = "already_used";
    } else {
      result = "denied";
      reason = "not_found";
    }
  } else {
    // allowed
    const candidates = guestsSeed.filter(
      (g) => g.status === "invited" && inPool(g),
    );
    guest =
      candidates[Math.floor(Math.random() * candidates.length)] ?? null;
    if (guest) {
      result = "allowed";
      const idx = guestsSeed.findIndex((g) => g.id === guest!.id);
      guestsSeed[idx] = {
        ...guestsSeed[idx],
        status: "checked_in",
        checkedInAt: now,
        updatedAt: now,
      };
      guest = guestsSeed[idx];
    } else {
      // Fallback if there are no invited guests left
      const checkedIn = guestsSeed.filter(
        (g) => g.status === "checked_in" && inPool(g),
      );
      guest =
        checkedIn[Math.floor(Math.random() * checkedIn.length)] ?? null;
      result = "denied";
      reason = guest ? "already_used" : "not_found";
    }
  }

  const graduate =
    guest && graduatesSeed.find((g) => g.id === guest!.graduateId)
      ? graduatesSeed.find((g) => g.id === guest!.graduateId)!
      : null;
  const ceremonyName = graduate
    ? ceremoniesSeed.find((c) => c.id === graduate.ceremonyId)?.name ?? null
    : null;

  const scanEvent: ScanEvent = {
    id: `scn_${Date.now()}`,
    guestId: guest?.id ?? null,
    scannedByUserId: args.scannedByUserId,
    scannedAt: now,
    result,
    reason,
  };
  scanEventsSeed.unshift(scanEvent);

  return { result, reason, guest, graduate, ceremonyName, scanEvent };
}

/* ------------------------------------------------------------------ */
/*  Reports helpers                                                    */
/* ------------------------------------------------------------------ */

export interface ScanEventRow extends ScanEvent {
  guestName: string | null;
  graduateName: string | null;
  ceremonyName: string | null;
  scannedByName: string;
  scannedByRole: string;
}

export async function getScanEventsAdmin(): Promise<ScanEventRow[]> {
  await delay();
  return scanEventsSeed
    .map((e) => {
      const guest = e.guestId
        ? guestsSeed.find((g) => g.id === e.guestId) ?? null
        : null;
      const graduate = guest
        ? graduatesSeed.find((g) => g.id === guest.graduateId) ?? null
        : null;
      const ceremony = graduate
        ? ceremoniesSeed.find((c) => c.id === graduate.ceremonyId)
        : undefined;
      const operator = usersSeed.find((u) => u.id === e.scannedByUserId);
      return {
        ...e,
        guestName: guest?.fullName ?? null,
        graduateName: graduate?.fullName ?? null,
        ceremonyName: ceremony?.name ?? null,
        scannedByName: operator?.fullName ?? "Operador desconocido",
        scannedByRole: operator?.role ?? "scanner",
      };
    })
    .sort((a, b) => b.scannedAt.localeCompare(a.scannedAt));
}

export interface AuditLogRow extends AuditEntry {
  actorName: string;
  actorRole: string;
}

export async function getAuditLogAdmin(): Promise<AuditLogRow[]> {
  await delay();
  return [...auditLogSeed]
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((e) => {
      const actor = usersSeed.find((u) => u.id === e.actorId);
      return {
        ...e,
        actorName: actor?.fullName ?? "Sistema",
        actorRole: actor?.role ?? "system",
      };
    });
}

export async function revokeGuestAdmin(id: string): Promise<Guest> {
  await delay();
  const idx = guestsSeed.findIndex((g) => g.id === id);
  if (idx === -1) throw new Error("Invitado no encontrado");
  const updated: Guest = {
    ...guestsSeed[idx],
    status: "revoked",
    updatedAt: new Date().toISOString(),
  };
  guestsSeed[idx] = updated;
  return updated;
}
