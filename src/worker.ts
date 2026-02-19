import "dotenv/config";
import { connectMongo } from "./config/mongo.js";
import { logger } from "./config/logger.js";
import { startReminderWorker } from "./modules/notifications/queue/reminder.worker.js";

async function main(): Promise<void> {
  await connectMongo();
  startReminderWorker();
  logger.info("Reminder worker started");
}

main().catch((err) => {
  logger.error({ err }, "Worker fatal error");
  process.exit(1);
});
