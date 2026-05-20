import type { Graduate, GraduateStatus } from "../types";
import {
  FACULTIES,
  buildDocument,
  buildInstitutionalEmail,
  buildName,
  buildStudentCode,
  pick,
} from "./_helpers";

interface CeremonySpec {
  ceremonyId: string;
  facultyName: keyof typeof FACULTIES;
  count: number;
  startSeed: number;
  baseDate: string;
  statusMix: Record<GraduateStatus, number>;
  maxGuests: number;
}

const SPECS: CeremonySpec[] = [
  {
    ceremonyId: "cer_ing_06_2026",
    facultyName: "Facultad de Ingenierías",
    count: 18,
    startSeed: 1,
    baseDate: "2026-05-15T16:24:00-05:00",
    statusMix: {
      eligible: 8,
      registered: 9,
      not_eligible: 1,
      completed: 0,
    },
    maxGuests: 4,
  },
  {
    ceremonyId: "cer_eco_06_2026",
    facultyName: "Facultad de Ciencias Económicas, Administrativas y Contables",
    count: 12,
    startSeed: 100,
    baseDate: "2026-05-14T11:00:00-05:00",
    statusMix: {
      eligible: 4,
      registered: 7,
      not_eligible: 1,
      completed: 0,
    },
    maxGuests: 3,
  },
  {
    ceremonyId: "cer_sal_04_2026",
    facultyName: "Facultad de Ciencias de la Salud",
    count: 20,
    startSeed: 200,
    baseDate: "2026-02-05T10:00:00-05:00",
    statusMix: {
      eligible: 0,
      registered: 0,
      not_eligible: 0,
      completed: 20,
    },
    maxGuests: 4,
  },
];

/**
 * Specific overrides for graduates referenced in audit-log or used as
 * known test fixtures. Keeping them here makes the relationships
 * inspectable in one place.
 */
const OVERRIDES: Record<string, Partial<Graduate>> = {
  // grd_0007: cupo excepcional aprobado (referenced in audit-log aud_006)
  grd_0007: { maxGuests: 6 },
};

function generate(): Graduate[] {
  const result: Graduate[] = [];
  let id = 1;

  for (const spec of SPECS) {
    const programs = FACULTIES[spec.facultyName];
    const statusPool: GraduateStatus[] = [];
    (Object.entries(spec.statusMix) as Array<[GraduateStatus, number]>).forEach(
      ([s, n]) => {
        for (let i = 0; i < n; i++) statusPool.push(s);
      },
    );

    for (let i = 0; i < spec.count; i++) {
      const seed = spec.startSeed + i;
      const name = buildName(seed);
      const program = pick(programs, seed * 5 + 3);
      const status = statusPool[i] ?? "eligible";

      const graduateId = `grd_${String(id).padStart(4, "0")}`;
      const base: Graduate = {
        id: graduateId,
        ceremonyId: spec.ceremonyId,
        documentType: "CC",
        documentNumber: buildDocument(seed),
        studentCode: buildStudentCode(seed),
        fullName: name.fullName,
        email: buildInstitutionalEmail(name.fullName, seed),
        program,
        faculty: spec.facultyName,
        maxGuests: spec.maxGuests,
        status,
        createdAt: spec.baseDate,
        updatedAt: spec.baseDate,
      };

      const override = OVERRIDES[graduateId];
      result.push(override ? { ...base, ...override } : base);
      id++;
    }
  }
  return result;
}

export const graduates: Graduate[] = generate();
