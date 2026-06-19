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

/** Events opted into the public catalog (/eventos) and open for registration. */
export async function getPublicEvents(): Promise<Ceremony[]> {
  await delay();
  return ceremoniesSeed
    .filter((c) => c.publicListed && c.status === "open")
    .sort((a, b) => a.date.localeCompare(b.date));
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
    result = result.filter(
      (g) =>
        (g.graduateId != null && gradIds.has(g.graduateId)) ||
        g.ceremonyId === args.ceremonyId,
    );
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
  const gsts = guestsSeed.filter(
    (g) =>
      (g.graduateId != null && gradIds.has(g.graduateId)) ||
      g.ceremonyId === ceremonyId,
  );
  const ceremony = ceremoniesSeed.find((c) => c.id === ceremonyId);

  return {
    ceremonyId,
    capacity: ceremony?.capacity ?? null,
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
    const grad = g.graduateId
      ? graduatesSeed.find((gr) => gr.id === g.graduateId)
      : undefined;
    const cerId = grad?.ceremonyId ?? g.ceremonyId ?? "";
    const cer = cerId
      ? ceremoniesSeed.find((c) => c.id === cerId)
      : undefined;
    return {
      ...g,
      graduateName: grad?.fullName ?? "—",
      graduateProgram: grad?.program ?? "—",
      ceremonyId: cerId,
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

/* ------------------------------------------------------------------ */
/*  Event types (mock — derived from the built-in registry)            */
/* ------------------------------------------------------------------ */

export async function getEventTypes(
  opts: { activeOnly?: boolean } = {},
): Promise<import("../types").EventTypeRecord[]> {
  await delay();
  void opts; // mock returns all built-ins regardless
  const { EVENT_TYPES } = await import("../terminology");
  return EVENT_TYPES.map((t, i) => ({
    value: t.value,
    label: t.label,
    eventNoun: t.eventNoun,
    participantSingular: t.participantSingular,
    participantPlural: t.participantPlural,
    guestSingular: t.guestSingular,
    guestPlural: t.guestPlural,
    invitePhrase: t.invitePhrase,
    photoRecommended: t.photoRecommended,
    defaultTemplate: t.defaultTemplate,
    defaultRegistrationMode: t.defaultRegistrationMode,
    customFields: t.customFields ?? [],
    isBuiltin: true,
    active: true,
    sortOrder: (i + 1) * 10,
  }));
}

/** In-memory organizer assignments for mock mode (ceremonyId → userIds). */
const eventOrganizers: Record<string, string[]> = {};

export async function getEventOrganizerIds(ceremonyId: string): Promise<string[]> {
  await delay();
  return eventOrganizers[ceremonyId] ?? [];
}

export async function setEventOrganizers(
  ceremonyId: string,
  userIds: string[],
): Promise<void> {
  await delay();
  eventOrganizers[ceremonyId] = [...userIds];
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
      photoUrl: null,
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
  /** null for self-registered attendees (no participant). */
  graduate: Graduate | null;
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
  const graduate = guest.graduateId
    ? graduatesSeed.find((g) => g.id === guest.graduateId) ?? null
    : null;
  const ceremonyId = graduate?.ceremonyId ?? guest.ceremonyId;
  const ceremony = ceremonyId
    ? ceremoniesSeed.find((c) => c.id === ceremonyId) ?? null
    : null;
  if (!ceremony) return null;

  let blocked: InvitationView["blocked"];
  if (guest.status === "revoked") blocked = "revoked";
  else if (ceremony.status === "completed" && guest.status !== "checked_in")
    blocked = "ceremony_completed";

  return { guest, graduate, ceremony, blocked };
}

/* ------------------------------------------------------------------ */
/*  Self-registration (public RSVP)                                    */
/* ------------------------------------------------------------------ */

export interface RegisterAttendeeResult {
  ok: boolean;
  error?: string;
  already?: boolean;
  guestId?: string;
  token?: string;
  fullName?: string;
}

export async function registerAttendee(
  ceremonyId: string,
  input: { fullName: string; email: string; document?: string | null },
): Promise<RegisterAttendeeResult> {
  await delay();
  const cer = ceremoniesSeed.find((c) => c.id === ceremonyId);
  if (!cer) return { ok: false, error: "not_found" };
  // Effective mode mirrors lib/terminology.effectiveRegistrationMode: an
  // explicit mode wins, else legacy events fall back to publicListed.
  const mode =
    cer.registrationMode ?? (cer.publicListed ? "self_service" : "invitation");
  if (mode !== "self_service") return { ok: false, error: "not_public" };
  if (
    cer.status !== "open" ||
    new Date(cer.registrationClosesAt).getTime() < Date.now()
  ) {
    return { ok: false, error: "closed" };
  }

  // Idempotent per email.
  const existing = guestsSeed.find(
    (g) =>
      g.ceremonyId === ceremonyId &&
      g.email != null &&
      g.email.toLowerCase() === input.email.toLowerCase() &&
      g.status !== "revoked",
  );
  if (existing) {
    return {
      ok: true,
      already: true,
      guestId: existing.id,
      token: existing.invitationToken,
      fullName: existing.fullName,
    };
  }

  if (cer.capacity != null) {
    const count = guestsSeed.filter(
      (g) => g.ceremonyId === ceremonyId && g.status !== "revoked",
    ).length;
    if (count >= cer.capacity) return { ok: false, error: "full" };
  }

  const now = new Date().toISOString();
  const id = `gst_self_${Date.now()}`;
  const token = crypto.randomUUID().replace(/-/g, "");
  const guest: Guest = {
    id,
    graduateId: null,
    ceremonyId,
    fullName: input.fullName,
    documentNumber: input.document ?? null,
    email: input.email,
    relationship: null,
    status: "invited",
    invitationToken: token,
    invitedAt: now,
    checkedInAt: null,
    createdAt: now,
    updatedAt: now,
  };
  guestsSeed.push(guest);
  return { ok: true, already: false, guestId: id, token, fullName: input.fullName };
}

/* ------------------------------------------------------------------ */
/*  Scanner simulation                                                 */
/* ------------------------------------------------------------------ */

export interface SimulatedScanResult {
  result: ScanResult;
  reason: ScanDeniedReason | null;
  /** Non-blocking warning (e.g. admitted while over capacity). */
  warning?: ScanDeniedReason | null;
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
    ceremonyGradIds
      ? g.graduateId != null && ceremonyGradIds.has(g.graduateId)
      : true;

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
/*  Manual check-in (scanner fallback — search by name / document)    */
/* ------------------------------------------------------------------ */

export interface GuestSearchRow {
  id: string;
  fullName: string;
  documentNumber: string | null;
  email: string | null;
  relationship: string | null;
  status: GuestStatus;
  graduateName: string;
}

export async function searchCeremonyGuests(args: {
  ceremonyId: string;
  query?: string;
}): Promise<GuestSearchRow[]> {
  await delay();
  const gradIds = new Set(
    graduatesSeed
      .filter((g) => g.ceremonyId === args.ceremonyId)
      .map((g) => g.id),
  );
  let rows = guestsSeed.filter(
    (g) =>
      (g.graduateId != null && gradIds.has(g.graduateId)) ||
      g.ceremonyId === args.ceremonyId,
  );

  const q = (args.query ?? "").trim().toLowerCase();
  if (q) {
    const qDigits = q.replace(/\D/g, "");
    rows = rows.filter(
      (g) =>
        g.fullName.toLowerCase().includes(q) ||
        (qDigits.length > 0 && (g.documentNumber ?? "").includes(qDigits)),
    );
  }

  return rows.slice(0, 20).map((g) => {
    const grad = graduatesSeed.find((gr) => gr.id === g.graduateId);
    return {
      id: g.id,
      fullName: g.fullName,
      documentNumber: g.documentNumber,
      email: g.email,
      relationship: g.relationship,
      status: g.status,
      graduateName: grad?.fullName ?? "—",
    };
  });
}

export async function manualCheckIn(args: {
  guestId: string;
  scannedByUserId: string;
}): Promise<SimulatedScanResult> {
  await delay();
  const now = new Date().toISOString();
  const idx = guestsSeed.findIndex((g) => g.id === args.guestId);

  let result: ScanResult = "allowed";
  let reason: ScanDeniedReason | null = null;
  let guest: Guest | null = idx >= 0 ? guestsSeed[idx] : null;

  if (idx < 0) {
    result = "denied";
    reason = "not_found";
  } else if (guestsSeed[idx].status === "revoked") {
    result = "denied";
    reason = "revoked";
  } else if (guestsSeed[idx].status === "checked_in") {
    result = "denied";
    reason = "already_used";
  } else {
    guestsSeed[idx] = {
      ...guestsSeed[idx],
      status: "checked_in",
      checkedInAt: now,
      updatedAt: now,
    };
    guest = guestsSeed[idx];
  }

  const graduate =
    guest && guest.graduateId
      ? graduatesSeed.find((g) => g.id === guest!.graduateId) ?? null
      : null;
  const cerId = graduate?.ceremonyId ?? guest?.ceremonyId ?? null;
  const ceremonyName = cerId
    ? ceremoniesSeed.find((c) => c.id === cerId)?.name ?? null
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
/*  Offline scan manifest (B4 — pre-downloaded event guest list)       */
/* ------------------------------------------------------------------ */

export interface ManifestEntry {
  token: string;
  name: string;
  status: GuestStatus;
}

export interface ScanManifest {
  ceremonyId: string;
  generatedAt: string;
  entries: ManifestEntry[];
}

/** Full token list for an event so the scanner can decide offline. */
export async function getScanManifest(ceremonyId: string): Promise<ScanManifest> {
  await delay();
  const gradIds = new Set(
    graduatesSeed
      .filter((g) => g.ceremonyId === ceremonyId)
      .map((g) => g.id),
  );
  const entries = guestsSeed
    .filter(
      (g) =>
        (g.graduateId != null && gradIds.has(g.graduateId)) ||
        g.ceremonyId === ceremonyId,
    )
    .map((g) => ({
      token: g.invitationToken,
      name: g.fullName,
      status: g.status,
    }));
  return { ceremonyId, generatedAt: new Date().toISOString(), entries };
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
