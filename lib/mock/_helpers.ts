/**
 * Internal helpers for the mock data layer. Not exported from the
 * package entry — `mock/index.ts` is the public surface.
 *
 * The generators are deterministic: given the same seed they produce
 * the same names, documents, etc. This keeps the seed data stable
 * across reloads and refactors.
 */

export const FIRST_NAMES_M = [
  "Andrés",
  "Carlos",
  "Daniel",
  "David",
  "Diego",
  "Esteban",
  "Felipe",
  "Gabriel",
  "Iván",
  "Javier",
  "Juan",
  "Julián",
  "Luis",
  "Mateo",
  "Miguel",
  "Nicolás",
  "Pablo",
  "Raúl",
  "Samuel",
  "Santiago",
  "Sebastián",
  "Sergio",
  "Simón",
  "Tomás",
];

export const FIRST_NAMES_F = [
  "Adriana",
  "Alejandra",
  "Ana",
  "Camila",
  "Carolina",
  "Catalina",
  "Daniela",
  "Diana",
  "Elena",
  "Gabriela",
  "Isabel",
  "Juliana",
  "Laura",
  "Lucía",
  "Manuela",
  "María",
  "Mariana",
  "Natalia",
  "Paula",
  "Sara",
  "Sofía",
  "Tatiana",
  "Valentina",
  "Verónica",
];

export const LAST_NAMES = [
  "Arango",
  "Bedoya",
  "Cardona",
  "Castaño",
  "Cárdenas",
  "Echeverri",
  "Escobar",
  "García",
  "Giraldo",
  "Gómez",
  "González",
  "Gutiérrez",
  "Henao",
  "Hernández",
  "Jaramillo",
  "López",
  "Mejía",
  "Mora",
  "Muñoz",
  "Ochoa",
  "Ospina",
  "Pérez",
  "Quintero",
  "Ramírez",
  "Restrepo",
  "Ríos",
  "Rodríguez",
  "Rojas",
  "Ruiz",
  "Salazar",
  "Sánchez",
  "Vargas",
  "Vélez",
  "Villa",
  "Zapata",
];

export const FACULTIES: Record<string, string[]> = {
  "Facultad de Ingenierías": [
    "Ingeniería Civil",
    "Ingeniería Mecánica",
    "Ingeniería Electrónica",
    "Ingeniería Industrial",
    "Ingeniería de Sistemas e Informática",
    "Ingeniería Química",
  ],
  "Facultad de Ciencias Económicas, Administrativas y Contables": [
    "Administración de Empresas",
    "Economía",
    "Contaduría Pública",
    "Negocios Internacionales",
  ],
  "Facultad de Ciencias de la Salud": [
    "Medicina",
    "Enfermería",
    "Odontología",
    "Nutrición y Dietética",
  ],
  "Facultad de Arquitectura, Diseño y Urbanismo": [
    "Arquitectura",
    "Diseño Gráfico",
    "Diseño Industrial",
  ],
  "Escuela de Ciencias Sociales": [
    "Comunicación Social y Periodismo",
    "Psicología",
    "Trabajo Social",
  ],
  "Escuela de Derecho y Ciencias Políticas": ["Derecho", "Ciencias Políticas"],
};

export function pick<T>(arr: readonly T[], seed: number): T {
  return arr[((seed % arr.length) + arr.length) % arr.length];
}

export function buildName(seed: number): {
  firstName: string;
  fullName: string;
  initials: string;
} {
  const isFemale = seed % 2 === 0;
  const first = isFemale
    ? pick(FIRST_NAMES_F, seed * 3 + 7)
    : pick(FIRST_NAMES_M, seed * 3 + 7);
  const last1 = pick(LAST_NAMES, seed * 11 + 13);
  const last2 = pick(LAST_NAMES, seed * 17 + 5);
  return {
    firstName: first,
    fullName: `${first} ${last1} ${last2}`,
    initials: `${first[0]}${last1[0]}`.toUpperCase(),
  };
}

export function buildDocument(seed: number): string {
  const base = 1_000_000_000 + ((seed * 73 + 17) % 99_999_999);
  return String(base).slice(0, 10);
}

export function buildStudentCode(seed: number): string {
  const prefix = "0001";
  const tail = String(seed * 7 + 13).padStart(5, "0").slice(0, 5);
  return `${prefix}${tail}`;
}

export function buildInstitutionalEmail(fullName: string, seed: number): string {
  const parts = normalize(fullName).split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "graduando";
  const last = parts[1] ?? "x";
  return `${first}.${last}${(seed % 100).toString().padStart(2, "0")}@upb.edu.co`;
}

export function buildPersonalEmail(fullName: string, seed: number): string {
  const parts = normalize(fullName).split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "user";
  const last = parts[parts.length - 1] ?? "x";
  const providers = ["gmail.com", "outlook.com", "hotmail.com"];
  return `${first}.${last}${(seed % 100).toString().padStart(2, "0")}@${
    providers[seed % providers.length]
  }`;
}

export function buildToken(seed: number): string {
  let h = (seed * 2654435761) >>> 0;
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 24; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    s += chars[h % chars.length];
  }
  return `inv_${s}`;
}

/** Days offset from a base ISO date, returns ISO datetime string. */
export function shiftDate(baseIso: string, days: number, hour = 10): string {
  const d = new Date(baseIso);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function delay(min = 60, max = 140): Promise<void> {
  return new Promise((r) =>
    setTimeout(r, min + Math.floor(Math.random() * (max - min))),
  );
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim();
}
