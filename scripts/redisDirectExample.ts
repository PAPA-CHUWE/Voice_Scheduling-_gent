/**
 * Development script: connect to Redis (REDIS_URL), set/get, disconnect.
 * Run: npx tsx scripts/redisDirectExample.ts
 * Ensure REDIS_URL in .env (e.g. rediss://default:TOKEN@immense-tiger-26265.upstash.io:6379)
 */
import "dotenv/config";
import {
  connectRedisDirect,
  disconnectRedisDirect,
  getRedisDirectClient,
} from "../src/config/redisDirect.js";

async function main(): Promise<void> {
  await connectRedisDirect();
  const client = getRedisDirectClient();

  await client.set("foo", "bar");
  const value = await client.get("foo");
  console.log("get('foo') =>", value);

  await disconnectRedisDirect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
