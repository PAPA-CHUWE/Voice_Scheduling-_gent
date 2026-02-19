import { z } from "zod";

const MAX_OFFSET_MINUTES = 7 * 24 * 60; // 7 days

function isValidIANATimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const timezoneSchema = z
  .string()
  .min(1)
  .refine(isValidIANATimezone, "Invalid IANA timezone");

export const emailSchema = z
  .string()
  .email("Invalid email")
  .optional()
  .or(z.literal(""));

export const reminderOffsetsMinutesSchema = z
  .array(z.number().int().min(1).max(MAX_OFFSET_MINUTES))
  .refine((arr) => new Set(arr).size === arr.length, "Offsets must be unique")
  .transform((arr) => [...arr].sort((a, b) => b - a))
  .default([60, 10]);

export const descriptionSchema = z
  .string()
  .max(2000, "Description must be at most 2000 characters")
  .optional();

export const attendeeNameSchema = z.string().min(2, "attendeeName must be at least 2 characters");

export const startIsoFutureSchema = z.string().refine(
  (val) => {
    const d = new Date(val);
    if (isNaN(d.getTime())) return false;
    const now = Date.now() - 60 * 1000; // 60 seconds grace
    return d.getTime() >= now;
  },
  "startIso must be a valid ISO datetime in the future (with 60s grace)"
);
