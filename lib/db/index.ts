/**
 * Real Supabase query layer.
 *
 * Mirrors the shape of `lib/mock/index.ts` 1:1, so the data router
 * (`lib/data.ts`) can swap between mock and real with zero changes
 * to call sites.
 *
 * Notes:
 *   - All functions are server-side (route handlers, RSC). Importing from
 *     a Client Component will fail at build because we use `next/headers`.
 *   - RLS does most of the heavy lifting; we don't recheck roles here.
 *   - For mutations, the caller must already have permission (RLS enforces).
 */

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
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
} from "@/lib/types";

import {
  auditFromRow,
  ceremonyFromRow,
  graduateFromRow,
  guestFromRow,
  scanEventFromRow,
  userFromRow,
} from "./mappers";

/* ────────────────────────────────────────────────────────────────────
   Ceremonies
   ──────────────────────────────────────────────────────────────────── */

export async function getCeremonies(): Promise<Ceremony[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ceremonies")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(ceremonyFromRow);
}

export async function getCeremony(id: string): Promise<Ceremony | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ceremonies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? ceremonyFromRow(data) : null;
}

export async function getActiveCeremonies(): Promise<Ceremony[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ceremonies")
    .select("*")
    .in("status", ["open", "in_progress"])
    .order("date");
  if (error) throw error;
  return (data ?? []).map(ceremonyFromRow);
}

export async function getNextCeremony(): Promise<Ceremony | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ceremonies")
    .select("*")
    .in("status", ["open", "in_progress"])
    .order("date")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? ceremonyFromRow(data) : null;
}

/* ────────────────────────────────────────────────────────────────────
   Graduates
   ──────────────────────────────────────────────────────────────────── */

export interface GetGraduatesArgs {
  ceremonyId?: string;
  status?: GraduateStatus;
  query?: string;
  limit?: number;
}

export async function getGraduates(
  args: GetGraduatesArgs = {},
): Promise<Graduate[]> {
  const supabase = await createClient();
  let q = supabase.from("graduates").select("*");

  if (args.ceremonyId) q = q.eq("ceremony_id", args.ceremonyId);
  if (args.status) q = q.eq("status", args.status);
  if (args.query) {
    const term = args.query.replace(/[%_]/g, "");
    q = q.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,student_code.ilike.%${term}%,document_number.ilike.%${term}%`,
    );
  }
  if (args.limit) q = q.limit(args.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(graduateFromRow);
}

export async function getGraduate(id: string): Promise<Graduate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("graduates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? graduateFromRow(data) : null;
}

export async function getGraduateByDocument(args: {
  documentNumber: string;
  ceremonyId?: string;
}): Promise<Graduate | null> {
  const supabase = await createClient();
  const cleaned = args.documentNumber.replace(/\D/g, "");
  let q = supabase
    .from("graduates")
    .select("*")
    .eq("document_number", cleaned);
  if (args.ceremonyId) q = q.eq("ceremony_id", args.ceremonyId);

  const { data, error } = await q.limit(1).maybeSingle();
  if (error) throw error;
  return data ? graduateFromRow(data) : null;
}

/* ────────────────────────────────────────────────────────────────────
   Guests
   ──────────────────────────────────────────────────────────────────── */

export interface GetGuestsArgs {
  graduateId?: string;
  ceremonyId?: string;
  status?: GuestStatus;
  limit?: number;
}

export async function getGuests(
  args: GetGuestsArgs = {},
): Promise<Guest[]> {
  const supabase = await createClient();

  if (args.ceremonyId && !args.graduateId) {
    // Need to filter via graduate's ceremony — use embedded join
    let q = supabase
      .from("guests")
      .select("*, graduates!inner(ceremony_id)")
      .eq("graduates.ceremony_id", args.ceremonyId);
    if (args.status) q = q.eq("status", args.status);
    if (args.limit) q = q.limit(args.limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(guestFromRow);
  }

  let q = supabase.from("guests").select("*");
  if (args.graduateId) q = q.eq("graduate_id", args.graduateId);
  if (args.status) q = q.eq("status", args.status);
  if (args.limit) q = q.limit(args.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(guestFromRow);
}

export async function getGuest(id: string): Promise<Guest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? guestFromRow(data) : null;
}

/* ────────────────────────────────────────────────────────────────────
   Users
   ──────────────────────────────────────────────────────────────────── */

export async function getUsers(): Promise<User[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(userFromRow);
}

export async function getUser(id: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? userFromRow(data) : null;
}

/* ────────────────────────────────────────────────────────────────────
   Scan events
   ──────────────────────────────────────────────────────────────────── */

export interface GetScanEventsArgs {
  result?: ScanResult;
  limit?: number;
}

export async function getScanEvents(
  args: GetScanEventsArgs = {},
): Promise<ScanEvent[]> {
  const supabase = await createClient();
  let q = supabase
    .from("scan_events")
    .select("*")
    .order("scanned_at", { ascending: false });
  if (args.result) q = q.eq("result", args.result);
  if (args.limit) q = q.limit(args.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(scanEventFromRow);
}

/* ────────────────────────────────────────────────────────────────────
   Audit log
   ──────────────────────────────────────────────────────────────────── */

export async function getAuditLog(
  args: { limit?: number } = {},
): Promise<AuditEntry[]> {
  const supabase = await createClient();
  let q = supabase
    .from("audit_log")
    .select("*")
    .order("at", { ascending: false });
  if (args.limit) q = q.limit(args.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(auditFromRow);
}

/* ────────────────────────────────────────────────────────────────────
   Aggregates (via Postgres functions)
   ──────────────────────────────────────────────────────────────────── */

export async function getCeremonyStats(
  ceremonyId: string,
): Promise<CeremonyStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_ceremony_stats", {
    p_ceremony_id: ceremonyId,
  });
  if (error) throw error;
  return data as unknown as CeremonyStats;
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
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_overview_stats");
  if (error) throw error;
  return data as unknown as OverviewStats;
}

/* ────────────────────────────────────────────────────────────────────
   Admin-specific joined queries
   ──────────────────────────────────────────────────────────────────── */

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
  const supabase = await createClient();
  let q = supabase
    .from("guests")
    .select(
      "*, graduates!inner(full_name, program, ceremony_id, ceremonies!inner(name))",
    );

  if (args.status) q = q.eq("status", args.status);
  if (args.ceremonyId) q = q.eq("graduates.ceremony_id", args.ceremonyId);
  if (args.query) {
    const term = args.query.replace(/[%_]/g, "");
    q = q.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,document_number.ilike.%${term}%`,
    );
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const grad = (row as unknown as { graduates: { full_name: string; program: string; ceremony_id: string; ceremonies: { name: string } } }).graduates;
    return {
      ...guestFromRow(row),
      graduateName: grad.full_name,
      graduateProgram: grad.program,
      ceremonyId: grad.ceremony_id,
      ceremonyName: grad.ceremonies.name,
    };
  });
}

/* ────────────────────────────────────────────────────────────────────
   Mutations
   ──────────────────────────────────────────────────────────────────── */

export type CreateCeremonyInput = Omit<
  Ceremony,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateCeremonyInput = Partial<
  Omit<Ceremony, "id" | "createdAt">
>;

export async function createCeremony(
  data: CreateCeremonyInput,
): Promise<Ceremony> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("ceremonies")
    .insert({
      name: data.name,
      date: data.date,
      start_time: data.startTime,
      end_time: data.endTime,
      venue: data.venue,
      campus: data.campus,
      faculty: data.faculty,
      status: data.status,
      registration_closes_at: data.registrationClosesAt,
      max_guests_default: data.maxGuestsDefault,
    })
    .select()
    .single();
  if (error) throw error;
  return ceremonyFromRow(row);
}

export async function updateCeremony(
  id: string,
  patch: UpdateCeremonyInput,
): Promise<Ceremony> {
  const supabase = await createClient();
  // Postgrest wants the strict Update type — cast at the boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.date !== undefined) update.date = patch.date;
  if (patch.startTime !== undefined) update.start_time = patch.startTime;
  if (patch.endTime !== undefined) update.end_time = patch.endTime;
  if (patch.venue !== undefined) update.venue = patch.venue;
  if (patch.campus !== undefined) update.campus = patch.campus;
  if (patch.faculty !== undefined) update.faculty = patch.faculty;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.registrationClosesAt !== undefined)
    update.registration_closes_at = patch.registrationClosesAt;
  if (patch.maxGuestsDefault !== undefined)
    update.max_guests_default = patch.maxGuestsDefault;

  const { data: row, error } = await supabase
    .from("ceremonies")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return ceremonyFromRow(row);
}

export type CreateUserInput = Omit<
  User,
  "id" | "createdAt" | "lastSignInAt"
>;
export type UpdateUserInput = Partial<Omit<User, "id" | "createdAt">>;

/**
 * Provision a staff user via the service role.
 * 1. Creates auth.users row with random password (admin sends invite later)
 * 2. Trigger handle_new_auth_user inserts public.users row
 * 3. Returns the resulting profile
 */
export async function createUser(data: CreateUserInput): Promise<User> {
  const service = createServiceClient();
  // SECURITY: app_metadata is admin-only (set via service role).
  // NEVER use user_metadata for is_staff/role — that field is user-editable
  // and would let anyone become admin if signup is ever enabled.
  const { data: authUser, error: authErr } = await service.auth.admin.createUser({
    email: data.email,
    email_confirm: true,
    app_metadata: {
      is_staff: true,
      full_name: data.fullName,
      role: data.role,
    },
  });
  if (authErr || !authUser.user) throw authErr ?? new Error("Auth create failed");

  // The trigger should have created public.users; if not (race), upsert.
  const { data: profile, error } = await service
    .from("users")
    .upsert({
      id: authUser.user.id,
      email: data.email,
      full_name: data.fullName,
      role: data.role,
      active: data.active,
    })
    .select()
    .single();
  if (error) throw error;
  return userFromRow(profile);
}

export async function updateUser(
  id: string,
  patch: UpdateUserInput,
): Promise<User> {
  const supabase = await createClient();
  // Postgrest wants the strict Update type — cast at the boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = {};
  if (patch.fullName !== undefined) update.full_name = patch.fullName;
  if (patch.email !== undefined) update.email = patch.email;
  if (patch.role !== undefined) update.role = patch.role;
  if (patch.active !== undefined) update.active = patch.active;

  const { data: row, error } = await supabase
    .from("users")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return userFromRow(row);
}

export type UpdateGraduateAdminInput = Partial<
  Omit<Graduate, "id" | "ceremonyId" | "createdAt">
>;

export async function updateGraduateAdmin(
  id: string,
  patch: UpdateGraduateAdminInput,
): Promise<Graduate> {
  const supabase = await createClient();
  // Postgrest wants the strict Update type — cast at the boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = {};
  if (patch.documentType !== undefined) update.document_type = patch.documentType;
  if (patch.documentNumber !== undefined)
    update.document_number = patch.documentNumber;
  if (patch.studentCode !== undefined) update.student_code = patch.studentCode;
  if (patch.fullName !== undefined) update.full_name = patch.fullName;
  if (patch.email !== undefined) update.email = patch.email;
  if (patch.program !== undefined) update.program = patch.program;
  if (patch.faculty !== undefined) update.faculty = patch.faculty;
  if (patch.maxGuests !== undefined) update.max_guests = patch.maxGuests;
  if (patch.status !== undefined) update.status = patch.status;

  const { data: row, error } = await supabase
    .from("graduates")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return graduateFromRow(row);
}

export async function revokeGuestAdmin(id: string): Promise<Guest> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("guests")
    .update({ status: "revoked" })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return guestFromRow(row);
}

/* ────────────────────────────────────────────────────────────────────
   Public invitation lookup (anon-callable Postgres function)
   ──────────────────────────────────────────────────────────────────── */

export interface InvitationView {
  guest: Guest;
  graduate: Graduate;
  ceremony: Ceremony;
  blocked?: "revoked" | "ceremony_completed";
}

interface RawInvitationRpc {
  guest: {
    id: string;
    fullName: string;
    email: string | null;
    status: string;
    invitationToken: string;
    checkedInAt: string | null;
  };
  graduate: { fullName: string; program: string; faculty: string };
  ceremony: {
    id: string;
    name: string;
    date: string;
    startTime: string;
    endTime: string;
    venue: string;
    campus: string;
  };
}

export async function getInvitationByToken(
  token: string,
): Promise<InvitationView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_invitation_by_token", {
    p_token: token,
  });
  if (error) throw error;
  if (!data) return null;
  const rpc = data as unknown as RawInvitationRpc | null;
  if (!rpc) return null;

  // Get the full rows by id so callers see the same shape as the mock
  const [guest, graduate, ceremony] = await Promise.all([
    getGuest(rpc.guest.id),
    (async () => {
      // Need graduate row; we know graduate exists since invitation joined it
      const { data: g, error: e } = await supabase
        .from("graduates")
        .select("*")
        .eq("full_name", rpc.graduate.fullName)
        .limit(1)
        .maybeSingle();
      if (e) throw e;
      return g ? graduateFromRow(g) : null;
    })(),
    getCeremony(rpc.ceremony.id),
  ]);
  if (!guest || !graduate || !ceremony) return null;

  let blocked: InvitationView["blocked"];
  if (guest.status === "revoked") blocked = "revoked";
  else if (ceremony.status === "completed" && guest.status !== "checked_in")
    blocked = "ceremony_completed";

  return { guest, graduate, ceremony, blocked };
}

/* ────────────────────────────────────────────────────────────────────
   Scanner — real QR validation (calls Postgres SECURITY DEFINER fn)
   ──────────────────────────────────────────────────────────────────── */

import type { ScanDeniedReason } from "@/lib/types";

export interface SimulatedScanResult {
  result: ScanResult;
  reason: ScanDeniedReason | null;
  guest: Guest | null;
  graduate: Graduate | null;
  ceremonyName: string | null;
  scanEvent: ScanEvent;
}

interface QrValidateRpc {
  result: ScanResult;
  reason: ScanDeniedReason | null;
  guestName: string | null;
  graduateId: string | null;
}

/**
 * Scans a real QR token. Atomic — the DB function locks the row,
 * checks status, marks checked-in, and logs the scan event in one tx.
 */
export async function simulateScan(args: {
  scannedByUserId: string;
  /** When set, scanner consumes this real QR token. */
  token?: string;
  /** Ignored in real mode (mock-only convenience). */
  ceremonyId?: string;
}): Promise<SimulatedScanResult> {
  if (!args.token) {
    throw new Error(
      "[db] simulateScan requires a real QR `token` in Supabase mode.",
    );
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("validate_qr_token", {
    p_token: args.token,
    p_scanner_id: args.scannedByUserId,
  });
  if (error) throw error;
  const rpc = data as unknown as QrValidateRpc;

  const guest = rpc.guestName
    ? ({
        id: "",
        graduateId: rpc.graduateId ?? "",
        fullName: rpc.guestName,
        documentNumber: null,
        email: null,
        relationship: null,
        status: rpc.result === "allowed" ? "checked_in" : "invited",
        invitationToken: args.token,
        invitedAt: null,
        checkedInAt: rpc.result === "allowed" ? new Date().toISOString() : null,
        createdAt: "",
        updatedAt: "",
      } as Guest)
    : null;

  const graduate = rpc.graduateId ? await getGraduate(rpc.graduateId) : null;
  const ceremony = graduate ? await getCeremony(graduate.ceremonyId) : null;

  const scanEvent: ScanEvent = {
    id: `scn_${Date.now()}`,
    guestId: guest?.id ?? null,
    scannedByUserId: args.scannedByUserId,
    scannedAt: new Date().toISOString(),
    result: rpc.result,
    reason: rpc.reason,
  };

  return {
    result: rpc.result,
    reason: rpc.reason,
    guest,
    graduate,
    ceremonyName: ceremony?.name ?? null,
    scanEvent,
  };
}

/* ────────────────────────────────────────────────────────────────────
   Reports — denormalized scan + audit (server-side joins)
   ──────────────────────────────────────────────────────────────────── */

export interface ScanEventRow extends ScanEvent {
  guestName: string | null;
  graduateName: string | null;
  ceremonyName: string | null;
  scannedByName: string;
  scannedByRole: string;
}

export async function getScanEventsAdmin(): Promise<ScanEventRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scan_events")
    .select(
      `
        *,
        guests(full_name, graduates(full_name, ceremonies(name))),
        users:scanned_by_user_id(full_name, role)
      `,
    )
    .order("scanned_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    type Joined = typeof row & {
      guests: {
        full_name: string;
        graduates: { full_name: string; ceremonies: { name: string } };
      } | null;
      users: { full_name: string; role: string } | null;
    };
    const r = row as Joined;
    return {
      ...scanEventFromRow(row),
      guestName: r.guests?.full_name ?? null,
      graduateName: r.guests?.graduates?.full_name ?? null,
      ceremonyName: r.guests?.graduates?.ceremonies?.name ?? null,
      scannedByName: r.users?.full_name ?? "Operador desconocido",
      scannedByRole: r.users?.role ?? "scanner",
    };
  });
}

export interface AuditLogRow extends AuditEntry {
  actorName: string;
  actorRole: string;
}

export async function getAuditLogAdmin(): Promise<AuditLogRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*, users:actor_id(full_name, role)")
    .order("at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    type Joined = typeof row & {
      users: { full_name: string; role: string } | null;
    };
    const r = row as Joined;
    return {
      ...auditFromRow(row),
      actorName: r.users?.full_name ?? "Sistema",
      actorRole: r.users?.role ?? "system",
    };
  });
}
