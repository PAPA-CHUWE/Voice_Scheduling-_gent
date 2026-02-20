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
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("ECONNREFUSED") || msg.includes("querySrv")) {
    logger.error(
      { err, hint: "MongoDB unreachable. Check MONGODB_URI, network, and Atlas cluster (resume if paused)." },
      "Worker fatal error"
    );
  } else {
    logger.error({ err }, "Worker fatal error");
  }
  process.exit(1);
});
