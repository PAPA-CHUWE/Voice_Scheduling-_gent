import { z } from "zod";

export const LoginBodySchema = z.object({
  email: z.string().email("Valid email is required"),
});

export type LoginInput = z.infer<typeof LoginBodySchema>;
