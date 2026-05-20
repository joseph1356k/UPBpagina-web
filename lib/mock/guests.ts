import type { Guest, GuestStatus } from "../types";
import { buildDocument, buildName, buildPersonalEmail, buildToken } from "./_helpers";
import { ceremonies } from "./ceremonies";
import { graduates } from "./graduates";

const CEREMONY_INDEX = new Map(ceremonies.map((c) => [c.id, c]));

const RELATIONSHIPS = [
  "Madre",
  "Padre",
  "Hermano/a",
  "Pareja",
  "Hijo/a",
  "Abuelo/a",
  "Tío/a",
  "Amigo/a",
];

function pickGuestStatus(seed: number, isCompletedCeremony: boolean): GuestStatus {
  const r = ((seed * 7) % 100 + 100) % 100;
  if (isCompletedCeremony) {
    if (r < 5) return "revoked";
    if (r < 18) return "invited"; // no-shows
    return "checked_in";
  }
  if (r < 8) return "revoked";
  return "invited";
}

function pickGuestCount(maxGuests: number, seed: number): number {
  const variance = ((seed * 11) % 3) - 1; // -1, 0, +1
  const target = Math.max(2, maxGuests - 1) + Math.max(0, variance);
  return Math.max(1, Math.min(target, maxGuests));
}

function generate(): Guest[] {
  const result: Guest[] = [];
  let id = 1;
  let seedBase = 5000;

  for (const grd of graduates) {
    if (grd.status === "eligible" || grd.status === "not_eligible") continue;

    const ceremony = CEREMONY_INDEX.get(grd.ceremonyId);
    if (!ceremony) continue;
    const isCompleted = ceremony.status === "completed";
    const count = pickGuestCount(grd.maxGuests, seedBase);

    for (let i = 0; i < count; i++) {
      const seed = seedBase + i;
      const name = buildName(seed);
      const status = pickGuestStatus(seed, isCompleted);

      const includeDocument = seed % 3 === 0;
      const includeEmail = seed % 4 !== 0;
      const relationship = RELATIONSHIPS[seed % RELATIONSHIPS.length];

      const invitedAt = grd.updatedAt;
      const checkedInAt =
        status === "checked_in"
          ? shiftMinutes(ceremony.date + "T08:30:00-05:00", (id % 90) - 10)
          : null;

      result.push({
        id: `gst_${String(id).padStart(4, "0")}`,
        graduateId: grd.id,
        fullName: name.fullName,
        documentNumber: includeDocument ? buildDocument(seed) : null,
        email: includeEmail ? buildPersonalEmail(name.fullName, seed) : null,
        relationship,
        status,
        invitationToken: buildToken(seed),
        invitedAt,
        checkedInAt,
        createdAt: grd.updatedAt,
        updatedAt: checkedInAt ?? grd.updatedAt,
      });
      id++;
    }
    seedBase += 100;
  }
  return result;
}

function shiftMinutes(iso: string, minutes: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

export const guests: Guest[] = generate();
