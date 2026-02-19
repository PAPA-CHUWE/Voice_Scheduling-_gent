import { env } from "../config/env.js";

const GRACE_SECONDS = 60;

export function addMinutes(isoString: string, minutes: number): string {
  const d = new Date(isoString);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

export function normalizeTimezone(tz?: string): string {
  return tz || env.DEFAULT_TIMEZONE;
}

export function isValidISO(isoString: string | null | undefined): boolean {
  if (!isoString || typeof isoString !== "string") return false;
  return !isNaN(new Date(isoString).getTime());
}

export function isStartInFuture(isoString: string): boolean {
  const start = new Date(isoString).getTime();
  const now = Date.now() - GRACE_SECONDS * 1000;
  return start >= now;
}

/** Format a Date in the given IANA timezone for display (e.g. in emails). */
export function formatInTimezone(
  date: Date,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone,
  }
): string {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: timezone }).format(date);
}
