import { z } from "zod";
import {
  timezoneSchema,
  emailSchema,
  reminderOffsetsMinutesSchema,
  descriptionSchema,
  attendeeNameSchema,
  startIsoFutureSchema,
} from "../../utils/validation.js";

export const CreateEventSchema = z.object({
  sessionId: z.string().optional(),
  attendeeName: attendeeNameSchema,
  attendeeEmail: emailSchema.transform((v) => (v === "" ? undefined : v)),
  title: z.string().min(1, "title is required"),
  startIso: z.string().datetime({ message: "startIso must be valid ISO 8601 datetime" }).and(startIsoFutureSchema),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  timezone: timezoneSchema.optional(),
  calendarId: z.string().optional(),
  description: descriptionSchema,
  reminderOffsetsMinutes: reminderOffsetsMinutesSchema.optional(),
  remindersEnabled: z.boolean().default(true),
});

export const ListEventsQuerySchema = z.object({
  sessionId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type ListEventsQuery = z.infer<typeof ListEventsQuerySchema>;
