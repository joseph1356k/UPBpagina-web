import type {
  CeremonyStatus,
  DocumentType,
  GraduateStatus,
  GuestStatus,
  ScanDeniedReason,
  ScanResult,
  UserRole,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Routes                                                            */
/* ------------------------------------------------------------------ */

export const ROUTES = {
  home: "/",

  // Graduado público
  registro: "/registro",
  registroVerificacion: "/registro/verificacion",
  registroConfirmacion: "/registro/confirmacion",

  // Workspace graduado
  portal: "/portal",
  portalInvitados: "/portal/invitados",
  portalInvitadosNuevo: "/portal/invitados/nuevo",

  // Admin
  admin: "/admin",
  adminCeremonias: "/admin/ceremonias",
  adminGraduandos: "/admin/graduandos",
  adminInvitados: "/admin/invitados",
  adminImportar: "/admin/importar",
  adminUsuarios: "/admin/usuarios",
  adminAuditoria: "/admin/auditoria",
  adminEscaneos: "/admin/escaneos",
  adminReportes: "/admin/reportes",
  adminTipos: "/admin/tipos",
  adminConfiguracion: "/admin/configuracion",

  // Public catalog
  eventos: "/eventos",

  // Public invitation
  invitacion: "/invitacion",

  // Scanner
  scanner: "/scanner",
  scannerHistorial: "/scanner/historial",

  // Dev
  devComponents: "/dev/components",
} as const;

/* ------------------------------------------------------------------ */
/*  Status labels (display strings)                                   */
/* ------------------------------------------------------------------ */

export const CEREMONY_STATUS_LABEL: Record<CeremonyStatus, string> = {
  draft: "Borrador",
  open: "Registro abierto",
  closed: "Registro cerrado",
  in_progress: "En curso",
  completed: "Finalizada",
};

export const GRADUATE_STATUS_LABEL: Record<GraduateStatus, string> = {
  eligible: "Elegible",
  not_eligible: "No elegible",
  registered: "Registrado",
  completed: "Completado",
};

export const GUEST_STATUS_LABEL: Record<GuestStatus, string> = {
  pending: "Pendiente",
  invited: "Invitado",
  checked_in: "Ingresó",
  revoked: "Revocado",
};

/**
 * Friendlier wording used in the graduate-facing portal where "pending"
 * reads as "still a draft on my list" and "invited" as "invitation sent".
 */
export const GUEST_STATUS_LABEL_GRADUATE: Record<GuestStatus, string> = {
  pending: "Borrador",
  invited: "Invitación enviada",
  checked_in: "Asistió",
  revoked: "Revocada",
};

export const GUEST_RELATIONSHIPS = [
  "Madre",
  "Padre",
  "Hermano/a",
  "Pareja",
  "Hijo/a",
  "Abuelo/a",
  "Tío/a",
  "Amigo/a",
  "Otro",
] as const;
export type GuestRelationship = (typeof GUEST_RELATIONSHIPS)[number];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  CC: "Cédula de ciudadanía",
  CE: "Cédula de extranjería",
  TI: "Tarjeta de identidad",
  PP: "Pasaporte",
};

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrador",
  scanner: "Personal de escaneo",
  coordinator: "Coordinador",
  organizer: "Organizador",
};

export const SCAN_RESULT_LABEL: Record<ScanResult, string> = {
  allowed: "Ingreso permitido",
  denied: "Ingreso denegado",
};

export const SCAN_DENIED_REASON_LABEL: Record<ScanDeniedReason, string> = {
  already_used: "QR ya utilizado",
  invalid_signature: "Firma inválida",
  wrong_ceremony: "Ceremonia incorrecta",
  outside_time_window: "Fuera de horario",
  revoked: "Invitación revocada",
  not_found: "QR no encontrado",
  capacity_full: "Aforo lleno",
};

/* ------------------------------------------------------------------ */
/*  Status variants (map to Badge variants)                           */
/* ------------------------------------------------------------------ */

export type StatusVariant =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

export const CEREMONY_STATUS_VARIANT: Record<CeremonyStatus, StatusVariant> = {
  draft: "neutral",
  open: "info",
  closed: "warning",
  in_progress: "success",
  completed: "neutral",
};

export const GRADUATE_STATUS_VARIANT: Record<GraduateStatus, StatusVariant> = {
  eligible: "info",
  not_eligible: "danger",
  registered: "success",
  completed: "neutral",
};

export const GUEST_STATUS_VARIANT: Record<GuestStatus, StatusVariant> = {
  pending: "neutral",
  invited: "info",
  checked_in: "success",
  revoked: "danger",
};

export const SCAN_RESULT_VARIANT: Record<ScanResult, StatusVariant> = {
  allowed: "success",
  denied: "danger",
};

/* ------------------------------------------------------------------ */
/*  Product metadata                                                  */
/* ------------------------------------------------------------------ */

export const PRODUCT = {
  name: "UPB Ceremonias",
  shortName: "Ceremonias",
  description:
    "Plataforma institucional de la Universidad Pontificia Bolivariana para el registro y validación de invitados en ceremonias de grado.",
  institution: "Universidad Pontificia Bolivariana",
  institutionShort: "UPB",
  /** Official UPB portal (Medellín / sede principal). */
  officialPortalUrl: "https://www.upb.edu.co",
} as const;
