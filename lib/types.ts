/**
 * Entity types for UPB Ceremonias.
 * These mirror the future Supabase schema 1:1 — the mock API in
 * `lib/mock/index.ts` returns objects shaped exactly like these, so the
 * UI never has to change when we swap the data layer.
 */

export type DocumentType = "CC" | "CE" | "TI" | "PP";

export type CeremonyStatus =
  | "draft"
  | "open"
  | "closed"
  | "in_progress"
  | "completed";

export type GraduateStatus =
  | "eligible"
  | "not_eligible"
  | "registered"
  | "completed";

export type GuestStatus = "pending" | "invited" | "checked_in" | "revoked";

export type UserRole = "admin" | "scanner" | "coordinator";

export type ScanResult = "allowed" | "denied";

export type ScanDeniedReason =
  | "already_used"
  | "invalid_signature"
  | "wrong_ceremony"
  | "outside_time_window"
  | "revoked"
  | "not_found";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "import"
  | "send_invitation"
  | "revoke"
  | "check_in"
  | "login";

export type EntityType =
  | "ceremony"
  | "graduate"
  | "guest"
  | "user"
  | "scan_event";

/**
 * An event. The physical table is still named `ceremonies` (legacy from the
 * graduation-only era); `eventType` + lib/terminology drive the user-facing
 * vocabulary per kind of event.
 */
export interface Ceremony {
  id: string;
  name: string;
  /** Event kind — see lib/terminology EVENT_TYPES. */
  eventType: string;
  /** Invitation email template key — see lib/email-templates. */
  emailTemplate: string;
  date: string; // ISO date (YYYY-MM-DD)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  venue: string;
  campus: string;
  faculty: string;
  status: CeremonyStatus;
  registrationClosesAt: string; // ISO datetime
  maxGuestsDefault: number;
  createdAt: string;
  updatedAt: string;
}

/** A participant (the person who registers guests). Table: `graduates`. */
export interface Graduate {
  id: string;
  ceremonyId: string;
  documentType: DocumentType;
  documentNumber: string;
  studentCode: string;
  fullName: string;
  email: string;
  program: string;
  faculty: string;
  maxGuests: number;
  status: GraduateStatus;
  /** Optional photo shown in invitation emails (public Storage URL). */
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  graduateId: string;
  fullName: string;
  documentNumber: string | null;
  email: string | null;
  /**
   * Free-form label for the guest's relationship to the graduate
   * (e.g. "Madre", "Pareja"). Optional — only used by the graduate portal
   * to help the graduate organize their list.
   */
  relationship: string | null;
  status: GuestStatus;
  invitationToken: string;
  invitedAt: string | null;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  lastSignInAt: string | null;
  createdAt: string;
}

export interface ScanEvent {
  id: string;
  guestId: string | null;
  scannedByUserId: string;
  scannedAt: string;
  result: ScanResult;
  reason: ScanDeniedReason | null;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  summary: string;
  at: string;
}

/**
 * Aggregated metrics derived from the underlying entities.
 * Used by the admin dashboard. Computed at read time in the mock layer;
 * in production these come from views or aggregate queries.
 */
export interface CeremonyStats {
  ceremonyId: string;
  graduatesCount: number;
  graduatesRegistered: number;
  guestsCount: number;
  guestsInvited: number;
  guestsCheckedIn: number;
  cuposTotal: number;
  cuposUsed: number;
}
