/**
 * Locale-aware formatters. Default locale is es-CO; date formatting uses
 * the bogotá time zone implicitly because all timestamps are stored as
 * ISO 8601 with offsets in the mock layer.
 */

const LOCALE = "es-CO";

const longDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const mediumDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export function formatDateLong(iso: string): string {
  return capitalize(longDateFormatter.format(new Date(iso)));
}

export function formatDateMedium(iso: string): string {
  return capitalize(mediumDateFormatter.format(new Date(iso)));
}

export function formatDateShort(iso: string): string {
  return shortDateFormatter.format(new Date(iso));
}

export function formatTime(value: string): string {
  // Accepts either "HH:mm" or full ISO
  if (/^\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(":").map(Number);
    const tmp = new Date();
    tmp.setHours(h, m, 0, 0);
    return timeFormatter.format(tmp);
  }
  return timeFormatter.format(new Date(value));
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** Format a Colombian document number with thousands separator. */
export function formatDocument(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** "Hace 3 minutos", "Hace 2 días", etc. */
export function formatRelativeFromNow(iso: string, now: Date = new Date()): string {
  const target = new Date(iso);
  const diffMs = target.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

  if (absSec < 60) return rtf.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
  const diffDay = Math.round(diffHr / 24);
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, "day");
  const diffMo = Math.round(diffDay / 30);
  if (Math.abs(diffMo) < 12) return rtf.format(diffMo, "month");
  const diffYr = Math.round(diffMo / 12);
  return rtf.format(diffYr, "year");
}

export function formatInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value);
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural ?? singular + "s"}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
