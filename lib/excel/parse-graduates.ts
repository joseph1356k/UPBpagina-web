/**
 * Excel/CSV parser for the graduates import flow.
 *
 * Accepts column headers in Spanish (the format Secretaría Académica uses),
 * normalizes them, and produces validated rows ready for bulk insert.
 *
 * Per-row validation is intentionally lenient: we surface warnings (e.g.
 * unusual email domain) but only hard errors block the row. Duplicates
 * within the same file are flagged as errors.
 */

import * as XLSX from "xlsx";

import type { DocumentType, GraduateStatus } from "@/lib/types";

export interface ParsedGraduateRow {
  rowNumber: number;
  documentType: DocumentType;
  documentNumber: string;
  studentCode: string;
  fullName: string;
  email: string;
  program: string;
  faculty: string;
  maxGuests: number | null;
  status: GraduateStatus;
  validation: "ok" | "warning" | "error";
  issue?: string;
}

export interface ParseResult {
  rows: ParsedGraduateRow[];
  detectedHeaders: string[];
  unmappedHeaders: string[];
}

/* ────────────────────────────────────────────────────────────────────
   Header mapping — accepts many common variations
   ──────────────────────────────────────────────────────────────────── */

type FieldKey =
  | "documentType"
  | "documentNumber"
  | "studentCode"
  | "fullName"
  | "firstName"
  | "lastName"
  | "email"
  | "program"
  | "faculty"
  | "maxGuests";

const HEADER_ALIASES: Record<FieldKey, string[]> = {
  documentType: ["tipo documento", "tipo de documento", "tipo doc", "tipodoc", "td"],
  documentNumber: [
    "documento", "numero documento", "número documento", "numero de documento",
    "número de documento", "cedula", "cédula", "cc", "identificacion",
    "identificación", "no documento", "n documento", "doc",
  ],
  studentCode: [
    "codigo", "código", "codigo estudiante", "código estudiante",
    "codigo estudiantil", "código estudiantil", "id estudiante",
    "id graduado", "matricula", "matrícula",
  ],
  fullName: [
    "nombre completo", "nombres y apellidos", "nombre y apellido",
    "estudiante", "graduando", "nombre",
  ],
  firstName: ["nombres", "primer nombre"],
  lastName: ["apellidos", "primer apellido"],
  email: [
    "correo", "correo electronico", "correo electrónico", "email", "e-mail", "mail",
    "email graduado", "correo graduado", "correo estudiante", "email estudiante",
  ],
  program: [
    "programa", "programa academico", "programa académico", "programa principal",
    "carrera", "pregrado", "posgrado",
  ],
  faculty: [
    "facultad", "escuela", "escuela facultad", "facultad escuela",
    "unidad academica", "unidad académica",
  ],
  maxGuests: [
    "cupos", "invitados", "cupos invitados", "max invitados",
    "máximo invitados", "maximo invitados", "cupo", "cupo invitados",
    "invitados maximos", "invitados máximos",
  ],
};

function normalizeHeader(h: string): string {
  return h
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildHeaderMap(headers: string[]): {
  map: Partial<Record<FieldKey, number>>;
  unmapped: string[];
} {
  const map: Partial<Record<FieldKey, number>> = {};
  const unmapped: string[] = [];

  headers.forEach((rawHeader, idx) => {
    const normalized = normalizeHeader(rawHeader);
    if (!normalized) return;

    let matched: FieldKey | null = null;
    for (const [key, aliases] of Object.entries(HEADER_ALIASES) as [
      FieldKey,
      string[],
    ][]) {
      if (aliases.includes(normalized)) {
        matched = key;
        break;
      }
    }
    if (matched && map[matched] === undefined) {
      map[matched] = idx;
    } else if (!matched) {
      unmapped.push(rawHeader);
    }
  });

  return { map, unmapped };
}

/* ────────────────────────────────────────────────────────────────────
   Value extraction + normalization
   ──────────────────────────────────────────────────────────────────── */

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function normalizeDocumentType(raw: string): DocumentType {
  const v = raw.toUpperCase().replace(/[^A-Z]/g, "");
  if (v === "CE" || v === "TI" || v === "PP") return v;
  if (v === "PASAPORTE" || v.startsWith("PA")) return "PP";
  return "CC";
}

function cleanDigits(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

function titleCase(raw: string): string {
  return raw
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ────────────────────────────────────────────────────────────────────
   Main parser
   ──────────────────────────────────────────────────────────────────── */

/**
 * Score a matrix by trying to use each of its first N rows as the header.
 * Returns the row index that matched the most graduate-like fields.
 */
function pickHeaderRow(matrix: unknown[][]): {
  rowIdx: number;
  matchCount: number;
} {
  let best = { rowIdx: 0, matchCount: 0 };
  const scanLimit = Math.min(8, matrix.length);
  for (let i = 0; i < scanLimit; i++) {
    const candidate = matrix[i].map((h) => String(h ?? "").trim());
    if (candidate.every((c) => !c)) continue;
    const { map } = buildHeaderMap(candidate);
    const count = Object.keys(map).length;
    if (count > best.matchCount) {
      best = { rowIdx: i, matchCount: count };
    }
  }
  return best;
}

export async function parseGraduatesFile(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  if (wb.SheetNames.length === 0) {
    return { rows: [], detectedHeaders: [], unmappedHeaders: [] };
  }

  // Pick the sheet that best matches graduate-like headers (auto-detect
  // when the workbook has multiple sheets like CEREMONIAS + GRADUADOS).
  let chosen: {
    sheetName: string;
    matrix: unknown[][];
    headerRowIdx: number;
    matchCount: number;
  } | null = null;

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const matrix: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      blankrows: false,
    });
    if (matrix.length === 0) continue;
    const { rowIdx, matchCount } = pickHeaderRow(matrix);
    if (!chosen || matchCount > chosen.matchCount) {
      chosen = { sheetName, matrix, headerRowIdx: rowIdx, matchCount };
    }
  }

  if (!chosen || chosen.matchCount === 0) {
    throw new Error(
      "No se pudo detectar la hoja de graduandos. Verifica que el archivo " +
        "tenga columnas como 'Cédula', 'Nombres', 'Apellidos', 'Email', 'Programa', 'Facultad'.",
    );
  }

  const { matrix, headerRowIdx } = chosen;
  const headerRow = matrix[headerRowIdx].map((h) => String(h ?? "").trim());
  const { map, unmapped } = buildHeaderMap(headerRow);

  // Validate that the required columns are present
  const requiredFields: FieldKey[] = [
    "documentNumber",
    "fullName",
    "email",
    "program",
    "faculty",
  ];
  const missing = requiredFields.filter(
    (f) =>
      map[f] === undefined &&
      !(f === "fullName" && map.firstName !== undefined && map.lastName !== undefined),
  );
  if (missing.length > 0) {
    throw new Error(
      `Faltan columnas requeridas: ${missing.join(", ")}. Encabezados detectados: ${headerRow.join(", ")}`,
    );
  }

  // Track duplicates inside the file
  const seenDocs = new Set<string>();
  const seenEmails = new Set<string>();
  const rows: ParsedGraduateRow[] = [];

  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const raw = matrix[r];
    const rowNumber = r + 1;
    const get = (k: FieldKey): string =>
      map[k] !== undefined ? cellText(raw[map[k]!]) : "";

    const docNumberRaw = get("documentNumber");
    if (!docNumberRaw && !get("fullName") && !get("email")) {
      continue; // blank row
    }

    const documentType = normalizeDocumentType(get("documentType"));
    const documentNumber = cleanDigits(docNumberRaw);
    const studentCode = get("studentCode") || "";
    let fullName = get("fullName");
    if (!fullName && (get("firstName") || get("lastName"))) {
      fullName = [get("firstName"), get("lastName")].filter(Boolean).join(" ");
    }
    fullName = titleCase(fullName);
    const email = get("email").toLowerCase();
    const program = get("program");
    const faculty = get("faculty");
    const maxGuestsRaw = get("maxGuests");
    const maxGuests = maxGuestsRaw ? parseInt(maxGuestsRaw, 10) : null;

    let validation: ParsedGraduateRow["validation"] = "ok";
    let issue: string | undefined;

    if (!documentNumber || documentNumber.length < 6) {
      validation = "error";
      issue = "Documento inválido (mínimo 6 dígitos)";
    } else if (!fullName) {
      validation = "error";
      issue = "Falta el nombre";
    } else if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validation = "error";
      issue = "Correo inválido";
    } else if (!program) {
      validation = "error";
      issue = "Falta el programa";
    } else if (!faculty) {
      validation = "error";
      issue = "Falta la facultad";
    } else if (seenDocs.has(documentNumber)) {
      validation = "error";
      issue = "Documento duplicado en el archivo";
    } else if (email && seenEmails.has(email)) {
      validation = "warning";
      issue = "Correo duplicado en el archivo";
    } else if (!email.endsWith("@upb.edu.co")) {
      validation = "warning";
      issue = "Correo con dominio no institucional";
    } else if (!studentCode) {
      validation = "warning";
      issue = "Falta código estudiantil";
    } else if (maxGuests !== null && (isNaN(maxGuests) || maxGuests < 0 || maxGuests > 20)) {
      validation = "warning";
      issue = "Cupo fuera de rango (se usará el por defecto)";
    }

    if (validation !== "error") {
      seenDocs.add(documentNumber);
      if (email) seenEmails.add(email);
    }

    rows.push({
      rowNumber,
      documentType,
      documentNumber,
      studentCode,
      fullName,
      email,
      program,
      faculty,
      maxGuests: maxGuests !== null && !isNaN(maxGuests) ? maxGuests : null,
      status: "eligible",
      validation,
      issue,
    });
  }

  return {
    rows,
    detectedHeaders: headerRow,
    unmappedHeaders: unmapped,
  };
}
