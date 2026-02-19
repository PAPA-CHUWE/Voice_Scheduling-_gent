import { Worker, type Job } from "bullmq";
import mongoose from "mongoose";

import { logger } from "../../../config/logger.js";
import { Event } from "../../events/events.model.js";
import { User } from "../../user/user.model.js";
import { AuditLog } from "../../auditLog/auditLog.model.js";
import { NotificationLog } from "../notificationLog.model.js";
import * as emailService from "../email/email.service.js";
import type { ReminderJobData } from "./reminder.queue.js";
import { REMINDER_QUEUE_NAME } from "./reminder.queue.js";
import { getRedisConnectionOptions } from "../../../config/redis.js";

async function processReminderJob(job: Job<ReminderJobData>): Promise<void> {
  const { eventId, offsetMinutes } = job.data;
  if (!mongoose.isValidObjectId(eventId)) {
    logger.warn({ eventId }, "Invalid eventId in reminder job");
    return;
  }

  const event = await Event.findById(eventId);
  if (!event) {
    logger.warn({ eventId }, "Event not found for reminder");
    return;
  }

  let toEmail: string | null = null;
  if (event.userId) {
    const user = await User.findById(event.userId);
    toEmail = user?.email ?? null;
  }

  if (!toEmail) {
    await AuditLog.create({
      type: "reminder_skipped",
      eventId: event._id,
      payload: { reason: "no_email", offsetMinutes },
      message: `Reminder skipped: no email for event ${eventId}`,
    });
    await NotificationLog.create({
      eventId: event._id,
      type: "reminder",
      offsetMinutes,
      status: "skipped",
      to: "",
    });
    return;
  }

  const result = await emailService.sendReminderEmail(event, toEmail, offsetMinutes);
  if (result === "skipped") {
    await AuditLog.create({
      type: "reminder_skipped",
      eventId: event._id,
      payload: { to: toEmail, offsetMinutes },
      message: `Reminder skipped for event ${eventId}`,
    });
  }
}

export function startReminderWorker(): Worker<ReminderJobData> {
  const conn = getRedisConnectionOptions();
  const worker = new Worker<ReminderJobData>(
    REMINDER_QUEUE_NAME,
    async (job) => {
      await processReminderJob(job);
    },
    {
      connection: conn,
      concurrency: 5,
    }
  );

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, eventId: job?.data?.eventId, err }, "Reminder job failed");
    if (job?.data?.eventId) {
      AuditLog.create({
        type: "reminder_failed",
        eventId: new mongoose.Types.ObjectId(job.data.eventId),
        payload: { error: err.message, offsetMinutes: job.data.offsetMinutes },
        message: `Reminder job failed: ${err.message}`,
      }).catch(() => {});
    }
  });

  return worker;
}
