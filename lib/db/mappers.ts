/**
 * Row → app-type mappers.
 *
 * Database columns are snake_case; app types are camelCase. These mappers
 * are the single source of truth for that conversion.
 */

import type { Database } from "@/lib/supabase/types";
import type {
  AuditEntry,
  Ceremony,
  Graduate,
  Guest,
  ScanEvent,
  User,
} from "@/lib/types";

type Tables = Database["public"]["Tables"];

export function ceremonyFromRow(row: Tables["ceremonies"]["Row"]): Ceremony {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    venue: row.venue,
    campus: row.campus,
    faculty: row.faculty,
    status: row.status,
    registrationClosesAt: row.registration_closes_at,
    maxGuestsDefault: row.max_guests_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function graduateFromRow(row: Tables["graduates"]["Row"]): Graduate {
  return {
    id: row.id,
    ceremonyId: row.ceremony_id,
    documentType: row.document_type,
    documentNumber: row.document_number,
    studentCode: row.student_code,
    fullName: row.full_name,
    email: row.email,
    program: row.program,
    faculty: row.faculty,
    maxGuests: row.max_guests,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function guestFromRow(row: Tables["guests"]["Row"]): Guest {
  return {
    id: row.id,
    graduateId: row.graduate_id,
    fullName: row.full_name,
    documentNumber: row.document_number,
    email: row.email,
    relationship: row.relationship,
    status: row.status,
    invitationToken: row.invitation_token,
    invitedAt: row.invited_at,
    checkedInAt: row.checked_in_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function userFromRow(row: Tables["users"]["Row"]): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    active: row.active,
    lastSignInAt: row.last_sign_in_at,
    createdAt: row.created_at,
  };
}

export function scanEventFromRow(
  row: Tables["scan_events"]["Row"],
): ScanEvent {
  return {
    id: row.id,
    guestId: row.guest_id,
    scannedByUserId: row.scanned_by_user_id,
    scannedAt: row.scanned_at,
    result: row.result,
    reason: row.reason,
  };
}

export function auditFromRow(row: Tables["audit_log"]["Row"]): AuditEntry {
  return {
    id: String(row.id),
    actorId: row.actor_id ?? "system",
    action: row.action as AuditEntry["action"],
    entityType: row.entity_type as AuditEntry["entityType"],
    entityId: row.entity_id,
    summary: row.summary,
    at: row.at,
  };
}
