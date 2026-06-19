/**
 * Minimal .ics (iCalendar) builder + downloader. No dependency.
 *
 * Times are emitted as "floating" local times (no Z / TZID): an in-person
 * event's local time is what every attendee should see, so this avoids
 * timezone math while staying correct for our single-timezone (Colombia) use.
 */

export interface CalendarEvent {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  venue: string;
  campus: string;
}

function icsDateTime(date: string, time: string): string {
  const [y, m, d] = date.split("-");
  const [hh = "00", mm = "00"] = (time || "00:00").split(":");
  return `${y}${m}${d}T${hh}${mm}00`;
}

function escapeIcs(s: string): string {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "evento"
  );
}

export function buildEventIcs(event: CalendarEvent): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UPB Ceremonias//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@upb-ceremonias`,
    `DTSTART:${icsDateTime(event.date, event.startTime)}`,
    `DTEND:${icsDateTime(event.date, event.endTime)}`,
    `SUMMARY:${escapeIcs(event.name)}`,
    `LOCATION:${escapeIcs(`${event.venue}, ${event.campus}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Trigger a client-side download of the event's .ics file. */
export function downloadIcs(event: CalendarEvent): void {
  const blob = new Blob([buildEventIcs(event)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(event.name)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
