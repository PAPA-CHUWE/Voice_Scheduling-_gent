import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

export async function connectMongo(): Promise<void> {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info({ host: mongoose.connection.host }, "MongoDB connected");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ECONNREFUSED") || msg.includes("querySrv")) {
      logger.error(
        {
          err,
          hint: "Check: 1) MONGODB_URI in .env 2) Internet/VPN 3) MongoDB Atlas cluster is running (not paused)",
        },
        "MongoDB connection failed"
      );
    }
    throw err;
  }
}
