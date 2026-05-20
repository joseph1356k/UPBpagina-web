import type { ScanDeniedReason, ScanEvent } from "../types";
import { guests } from "./guests";
import { users } from "./users";

const SCANNER_USERS = users.filter((u) => u.role === "scanner");

const DENIED_REASONS: ScanDeniedReason[] = [
  "already_used",
  "revoked",
  "invalid_signature",
  "wrong_ceremony",
  "outside_time_window",
  "not_found",
];

function generate(): ScanEvent[] {
  const events: ScanEvent[] = [];
  let id = 1;

  // Successful check-ins — one event per checked_in guest
  const checkedIn = guests.filter((g) => g.status === "checked_in");
  for (const g of checkedIn) {
    events.push({
      id: `scn_${String(id).padStart(4, "0")}`,
      guestId: g.id,
      scannedByUserId: SCANNER_USERS[id % SCANNER_USERS.length].id,
      scannedAt: g.checkedInAt ?? "2026-04-18T08:45:00-05:00",
      result: "allowed",
      reason: null,
    });
    id++;
  }

  // Denied attempts during the completed ceremony — friction the team saw at the door
  const baseDate = new Date("2026-04-18T08:32:00-05:00");
  const sampleGuests = guests.slice(0, 18);
  for (let i = 0; i < 18; i++) {
    const reason = DENIED_REASONS[i % DENIED_REASONS.length];
    const guestId =
      reason === "not_found" || reason === "invalid_signature"
        ? null
        : sampleGuests[i].id;
    const at = new Date(baseDate.getTime() + i * 7 * 60 * 1000).toISOString();

    events.push({
      id: `scn_${String(id).padStart(4, "0")}`,
      guestId,
      scannedByUserId: SCANNER_USERS[i % SCANNER_USERS.length].id,
      scannedAt: at,
      result: "denied",
      reason,
    });
    id++;
  }

  return events.sort((a, b) => b.scannedAt.localeCompare(a.scannedAt));
}

export const scanEvents: ScanEvent[] = generate();
