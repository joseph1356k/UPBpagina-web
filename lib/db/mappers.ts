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
    eventType: row.event_type,
    emailTemplate: row.email_template,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    venue: row.venue,
    campus: row.campus,
    faculty: row.faculty,
    status: row.status,
    registrationClosesAt: row.registration_closes_at,
    maxGuestsDefault: row.max_guests_default,
    capacity: row.capacity,
    publicListed: row.public_listed,
    capacityEnforce: row.capacity_enforce,
    registrationMode:
      row.registration_mode === "self_service" ||
      row.registration_mode === "invitation"
        ? row.registration_mode
        : null,
    customData: (row.custom_data as Record<string, string>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function eventTypeFromRow(
  row: Tables["event_types"]["Row"],
): import("@/lib/types").EventTypeRecord {
  return {
    value: row.value,
    label: row.label,
    eventNoun: row.event_noun,
    participantSingular: row.participant_singular,
    participantPlural: row.participant_plural,
    guestSingular: row.guest_singular,
    guestPlural: row.guest_plural,
    invitePhrase: row.invite_phrase,
    photoRecommended: row.photo_recommended,
    defaultTemplate: row.default_template,
    defaultRegistrationMode:
      row.default_registration_mode === "self_service"
        ? "self_service"
        : "invitation",
    customFields: Array.isArray(row.custom_fields)
      ? (row.custom_fields as import("@/lib/terminology").CustomFieldDef[])
      : [],
    isBuiltin: row.is_builtin,
    active: row.active,
    sortOrder: row.sort_order,
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
    photoUrl: row.photo_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function guestFromRow(row: Tables["guests"]["Row"]): Guest {
  return {
    id: row.id,
    graduateId: row.graduate_id,
    ceremonyId: row.ceremony_id,
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
