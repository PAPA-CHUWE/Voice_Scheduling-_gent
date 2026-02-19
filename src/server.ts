import app from "./app.js";
import { connectMongo } from "./config/mongo.js";
import { logger } from "./config/logger.js";
import { env } from "./config/env.js";

async function main(): Promise<void> {
  if (env.NODE_ENV !== "test") {
    await connectMongo();
  }



app.listen(env.PORT, "0.0.0.0", () => {
  logger.info({ port: env.PORT }, "Server listening");
});

main().catch((err) => {
  logger.error({ err }, "Fatal error");
  process.exit(1);
});
