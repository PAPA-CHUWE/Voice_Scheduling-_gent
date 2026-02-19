import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;

/**
 * Direct Redis client (node-redis) for development and direct get/set usage.
 * Uses REDIS_URL from env (e.g. rediss:// for Upstash TLS).
 * Connect once, then use get/set; disconnect when done (e.g. script exit).
 */
export function getRedisDirectClient(): RedisClientType {
  if (client) return client;
  client = createClient({
    url:"rediss://default:AWaZAAIncDEyZmQ2ZWIzNDg4MWY0NDU0ODRiMTc0NjYwMThkOTgyOXAxMjYyNjU@immense-tiger-26265.upstash.io:6379",
  });
  client.on("error", (err: Error) => {
    logger.error({ err }, "Redis direct client error");
  });
  return client;
}

/** Connect the direct Redis client. Call once before get/set. */
export async function connectRedisDirect(): Promise<RedisClientType> {
  const c = getRedisDirectClient();
  if (!c.isOpen) await c.connect();
  logger.info("Redis direct client connected");
  return c;
}

/** Disconnect the direct Redis client. Call when done (e.g. script exit). */
export async function disconnectRedisDirect(): Promise<void> {
  if (client?.isOpen) {
    await client.disconnect();
    logger.info("Redis direct client disconnected");
  }
  client = null;
}
