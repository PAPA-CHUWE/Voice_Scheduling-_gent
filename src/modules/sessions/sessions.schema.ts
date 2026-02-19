import { z } from "zod";
import { timezoneSchema, emailSchema } from "../../utils/validation.js";

export const CreateSessionSchema = z.object({
  channel: z.enum(["web", "voice", "api"]).default("voice"),
  timezone: timezoneSchema.optional(),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  userName: z.string().optional(),
  email: emailSchema.transform((v) => (v === "" ? undefined : v)),
  meetingTitle: z.string().optional(),
  proposedStartIso: z.string().datetime().optional(),
});

export const UpdateSessionSchema = z.object({
  userName: z.string().optional(),
  email: emailSchema.transform((v) => (v === "" ? undefined : v)),
  meetingTitle: z.string().optional(),
  proposedStartIso: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  status: z.enum(["initiated", "collecting", "confirmed", "booked", "failed"]).optional(),
});

export const ListSessionsQuerySchema = z.object({
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
export type ListSessionsQuery = z.infer<typeof ListSessionsQuerySchema>;
