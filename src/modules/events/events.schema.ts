import { z } from "zod";
import {
  timezoneSchema,
  reminderOffsetsMinutesSchema,
  descriptionSchema,
  attendeeNameSchema,
  startIsoFutureSchema,
} from "../../utils/validation.js";

const objectIdSchema = z.string().min(24).max(24).regex(/^[a-f0-9]{24}$/i, "Must be a valid 24-character hex ID").optional();

export const CreateEventSchema = z.object({
  sessionId: objectIdSchema,
  attendeeName: attendeeNameSchema,
  attendeeEmail: z
    .union([z.string().email("Invalid email"), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  title: z.string().min(1, "title is required"),
  startIso: z.string().datetime({ message: "startIso must be valid ISO 8601 datetime" }).and(startIsoFutureSchema),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  timezone: timezoneSchema.optional(),
  calendarId: z.string().optional(),
  description: descriptionSchema,
  reminderOffsetsMinutes: reminderOffsetsMinutesSchema.optional(),
  remindersEnabled: z.boolean().default(true),
});

const optionalPage = z.preprocess(
  (v) => (v === "" || v === undefined ? undefined : v),
  z.coerce.number().int().min(1).default(1)
);
const optionalLimit = z.preprocess(
  (v) => (v === "" || v === undefined ? undefined : v),
  z.coerce.number().int().min(1).max(100).default(20)
);

export const ListEventsQuerySchema = z.object({
  sessionId: z.string().optional(),
  limit: optionalLimit,
  page: optionalPage,
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type ListEventsQuery = z.infer<typeof ListEventsQuerySchema>;
