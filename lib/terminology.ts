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

export interface EventTerminology {
  /** Stored value (ceremonies.event_type). */
  value: EventType;
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
}

export const EVENT_TYPES: readonly EventTerminology[] = [
  {
    value: "graduation",
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
 * Resolve the terminology for an event type. Unknown / legacy values fall
 * back to graduation (the platform's original behaviour) so old rows can
 * never break the UI.
 */
export function getTerminology(eventType: string | null | undefined): EventTerminology {
  return BY_VALUE.get(eventType as EventType) ?? BY_VALUE.get("graduation")!;
}

/** Capitalize the first letter (labels arrive lowercase by design). */
export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
