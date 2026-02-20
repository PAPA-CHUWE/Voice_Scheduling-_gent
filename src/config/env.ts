import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default("mongodb+srv://tchuwe41_db_user:rRDC60xWe9nml5wN@cluster0.yju1bva.mongodb.net/VSA_Backend?appName=Cluster0"),
  API_KEY: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_CALENDAR_ID: z.string().default("primary"),
  DEFAULT_TIMEZONE: z.string().default("Africa/Harare"),
  CORS_ORIGINS: z.string().default("*"),
  EMAIL_ENABLED: z
    .string()
    .transform((v) => v !== "false" && v !== "0")
    .default("true"),
  EMAIL_FROM: z.string().default("Voice Agent <no-reply@yourdomain.com>"),
  RESEND_API_KEY: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(1).optional(),
  REMINDERS_ENABLED: z
    .string()
    .transform((v) => v !== "false" && v !== "0")
    .default("true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export type Env = z.infer<typeof envSchema>;
