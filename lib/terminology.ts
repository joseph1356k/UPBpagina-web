/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  Event-type terminology layer                                       ║
 * ╚════════════════════════════════════════════════════════════════════╝
 *
 * The platform manages many kinds of events, but each kind speaks its own
 * language: a graduation has "graduandos", a sports event has
 * "participantes", an investor meeting has "asistentes". UI components and
 * email templates pull their labels from here instead of hardcoding
 * graduation terms.
 *
 * Physical DB names (ceremonies / graduates) are legacy and intentionally
 * unchanged — this module is the single mapping between those tables and
 * the user-facing vocabulary.
 *
 * Adding a new event type = adding one entry to EVENT_TYPES. No migration
 * needed (the column is app-validated text).
 */

import type { RegistrationMode } from "./types";

export type EventType =
  | "graduation"
  | "institutional"
  | "private"
  | "sports"
  | "catering"
  | "investors"
  | "conference"
  | "talk"
  | "workshop"
  | "seminar"
  | "fair"
  | "business"
  | "other";

/**
 * A custom field definition attached to an event type. Answers live in
 * ceremonies.custom_data keyed by `key`.
 */
export interface CustomFieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
  required?: boolean;
  hint?: string;
}

export interface EventTerminology {
  /** Stored value (ceremonies.event_type). */
  value: string;
  /** Display name of the event type. */
  label: string;
  /** "ceremonia", "evento", "conferencia"… used in phrases. */
  eventNoun: string;
  /** The person who owns guests: "graduando", "participante", "anfitrión"… */
  participantSingular: string;
  participantPlural: string;
  /** People who receive the QR pass. */
  guestSingular: string;
  guestPlural: string;
  /** Phrase used in invitation emails: "{participant} te invita a…" */
  invitePhrase: string;
  /** Whether the participant photo upload makes sense for this type. */
  photoRecommended: boolean;
  /** Suggested email template key (admin can override per event). */
  defaultTemplate: "clasica" | "elegante" | "moderna";
  /** Recommended registration mode for new events of this type. */
  defaultRegistrationMode: RegistrationMode;
  /** Per-type custom fields (empty for built-ins until an admin adds some). */
  customFields?: CustomFieldDef[];
}

export const EVENT_TYPES: readonly EventTerminology[] = [
  {
    value: "graduation",
    defaultRegistrationMode: "invitation",
    label: "Ceremonia de grado",
    eventNoun: "ceremonia",
    participantSingular: "graduando",
    participantPlural: "graduandos",
    guestSingular: "invitado",
    guestPlural: "invitados",
    invitePhrase: "te ha invitado a acompañarle en su ceremonia de grado",
    photoRecommended: true,
    defaultTemplate: "elegante",
  },
  {
    value: "institutional",
    defaultRegistrationMode: "self_service",
    label: "Evento institucional",
    eventNoun: "evento",
    participantSingular: "anfitrión",
    participantPlural: "anfitriones",
    guestSingular: "invitado",
    guestPlural: "invitados",
    invitePhrase: "te ha invitado a este evento institucional",
    photoRecommended: false,
    defaultTemplate: "clasica",
  },
  {
    value: "private",
    defaultRegistrationMode: "invitation",
    label: "Evento privado",
    eventNoun: "evento",
    participantSingular: "anfitrión",
    participantPlural: "anfitriones",
    guestSingular: "invitado",
    guestPlural: "invitados",
    invitePhrase: "te ha invitado a este evento privado",
    photoRecommended: true,
    defaultTemplate: "moderna",
  },
  {
    value: "sports",
    defaultRegistrationMode: "self_service",
    label: "Evento deportivo",
    eventNoun: "evento",
    participantSingular: "participante",
    participantPlural: "participantes",
    guestSingular: "asistente",
    guestPlural: "asistentes",
    invitePhrase: "te ha invitado a este evento deportivo",
    photoRecommended: false,
    defaultTemplate: "moderna",
  },
  {
    value: "catering",
    defaultRegistrationMode: "invitation",
    label: "Evento de catering",
    eventNoun: "evento",
    participantSingular: "anfitrión",
    participantPlural: "anfitriones",
    guestSingular: "invitado",
    guestPlural: "invitados",
    invitePhrase: "te ha invitado",
    photoRecommended: false,
    defaultTemplate: "elegante",
  },
  {
    value: "investors",
    defaultRegistrationMode: "self_service",
    label: "Reunión con inversionistas",
    eventNoun: "reunión",
    participantSingular: "anfitrión",
    participantPlural: "anfitriones",
    guestSingular: "asistente",
    guestPlural: "asistentes",
    invitePhrase: "te ha invitado a esta reunión",
    photoRecommended: false,
    defaultTemplate: "clasica",
  },
  {
    value: "conference",
    defaultRegistrationMode: "self_service",
    label: "Conferencia",
    eventNoun: "conferencia",
    participantSingular: "organizador",
    participantPlural: "organizadores",
    guestSingular: "asistente",
    guestPlural: "asistentes",
    invitePhrase: "te ha invitado a esta conferencia",
    photoRecommended: false,
    defaultTemplate: "clasica",
  },
  {
    value: "talk",
    defaultRegistrationMode: "self_service",
    label: "Charla",
    eventNoun: "charla",
    participantSingular: "organizador",
    participantPlural: "organizadores",
    guestSingular: "asistente",
    guestPlural: "asistentes",
    invitePhrase: "te ha invitado a esta charla",
    photoRecommended: false,
    defaultTemplate: "moderna",
  },
  {
    value: "workshop",
    defaultRegistrationMode: "self_service",
    label: "Taller",
    eventNoun: "taller",
    participantSingular: "organizador",
    participantPlural: "organizadores",
    guestSingular: "asistente",
    guestPlural: "asistentes",
    invitePhrase: "te ha invitado a este taller",
    photoRecommended: false,
    defaultTemplate: "moderna",
  },
  {
    value: "seminar",
    defaultRegistrationMode: "self_service",
    label: "Seminario",
    eventNoun: "seminario",
    participantSingular: "organizador",
    participantPlural: "organizadores",
    guestSingular: "asistente",
    guestPlural: "asistentes",
    invitePhrase: "te ha invitado a este seminario",
    photoRecommended: false,
    defaultTemplate: "clasica",
  },
  {
    value: "fair",
    defaultRegistrationMode: "self_service",
    label: "Feria",
    eventNoun: "feria",
    participantSingular: "expositor",
    participantPlural: "expositores",
    guestSingular: "asistente",
    guestPlural: "asistentes",
    invitePhrase: "te ha invitado a esta feria",
    photoRecommended: false,
    defaultTemplate: "moderna",
  },
  {
    value: "business",
    defaultRegistrationMode: "self_service",
    label: "Reunión empresarial",
    eventNoun: "reunión",
    participantSingular: "anfitrión",
    participantPlural: "anfitriones",
    guestSingular: "asistente",
    guestPlural: "asistentes",
    invitePhrase: "te ha invitado a esta reunión",
    photoRecommended: false,
    defaultTemplate: "clasica",
  },
  {
    value: "other",
    defaultRegistrationMode: "self_service",
    label: "Otro",
    eventNoun: "evento",
    participantSingular: "participante",
    participantPlural: "participantes",
    guestSingular: "invitado",
    guestPlural: "invitados",
    invitePhrase: "te ha invitado a este evento",
    photoRecommended: false,
    defaultTemplate: "clasica",
  },
] as const;

const BY_VALUE = new Map(EVENT_TYPES.map((t) => [t.value, t]));

/** Values accepted by the API (zod-friendly). */
export const EVENT_TYPE_VALUES = EVENT_TYPES.map((t) => t.value) as [
  EventType,
  ...EventType[],
];

/**
 * Resolve the terminology for an event type from the BUILT-IN registry.
 * Sync + always available — used by client components and zod.
 *
 * Admin-managed types (lib/db event_types table) are the source of truth
 * at runtime; resolve those with `terminologyFromRow` (server side) or by
 * passing the loaded list to components. This fallback guarantees old /
 * unknown values never break the UI.
 */
export function getTerminology(eventType: string | null | undefined): EventTerminology {
  return BY_VALUE.get(eventType as EventType) ?? BY_VALUE.get("graduation")!;
}

/** Shape of an event_types DB row (snake_case) for the mapper below. */
export interface EventTypeRow {
  value: string;
  label: string;
  event_noun: string;
  participant_singular: string;
  participant_plural: string;
  guest_singular: string;
  guest_plural: string;
  invite_phrase: string;
  photo_recommended: boolean;
  default_template: string;
  default_registration_mode?: string;
  custom_fields?: unknown;
  active?: boolean;
  sort_order?: number;
  is_builtin?: boolean;
}

/** Build runtime terminology from a DB row (admin-managed types). */
export function terminologyFromRow(row: EventTypeRow): EventTerminology {
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
    defaultTemplate: (["clasica", "elegante", "moderna"].includes(
      row.default_template,
    )
      ? row.default_template
      : "clasica") as EventTerminology["defaultTemplate"],
    defaultRegistrationMode:
      row.default_registration_mode === "self_service"
        ? "self_service"
        : "invitation",
    customFields: Array.isArray(row.custom_fields)
      ? (row.custom_fields as CustomFieldDef[])
      : [],
  };
}

/** A slug is a valid event-type value shape (DB-stored, app-validated). */
export const EVENT_TYPE_SLUG_RE = /^[a-z][a-z0-9_-]{1,39}$/;

/** Capitalize the first letter (labels arrive lowercase by design). */
export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Resolve how an event actually delivers its QR.
 *
 * An explicit `registrationMode` always wins. When it's null (legacy events
 * never touched since this feature shipped), we fall back to the historical
 * behaviour — `publicListed` was the de-facto self-registration switch — so
 * no existing event changes how it works. The event type's *recommendation*
 * is intentionally NOT consulted here; it only pre-fills the form for new
 * events (see ceremony-form).
 */
export function effectiveRegistrationMode(c: {
  registrationMode: RegistrationMode | null;
  publicListed: boolean;
}): RegistrationMode {
  return c.registrationMode ?? (c.publicListed ? "self_service" : "invitation");
}
