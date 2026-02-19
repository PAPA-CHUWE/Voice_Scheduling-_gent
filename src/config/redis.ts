import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

let client: Redis | null = null;

/** Connection options for BullMQ (from REDIS_URL). Supports redis:// and rediss:// (TLS, e.g. Upstash). */
export function getRedisConnectionOptions(): {
  host: string;
  port: number;
  password?: string;
  tls?: object;
} {
  const isTls = env.REDIS_URL.startsWith("rediss://");
  const s = env.REDIS_URL.replace(/^rediss?:\/\//, "");
  const at = s.indexOf("@");
  const hostPort = at >= 0 ? s.slice(at + 1) : s;
  const [host, portStr] = hostPort.split(":");
  const port = portStr ? parseInt(portStr, 10) : 6379;
  const password = at >= 0 ? s.slice(0, at).replace(/^[^:]*:/, "") : undefined;
  return {
    host: host || "localhost",
    port: Number.isNaN(port) ? 6379 : port,
    ...(password ? { password } : {}),
    ...(isTls ? { tls: { rejectUnauthorized: true } } : {}),
  };
}

export function getRedisConnection(): Redis {
  if (!client) {
    client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
    client.on("error", (err: Error) => logger.error({ err }, "Redis connection error"));
    client.on("connect", () => logger.info("Redis connected"));
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
