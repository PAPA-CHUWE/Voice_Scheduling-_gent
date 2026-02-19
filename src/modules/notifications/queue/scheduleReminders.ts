import mongoose from "mongoose";
import { env } from "../../../config/env.js";
import type { IEventDoc } from "../../events/events.model.js";
import { getReminderQueueSingleton } from "./reminder.queue.js";

/** Schedule reminder jobs for an event. Only schedules jobs whose run time is in the future. */
export async function scheduleRemindersForEvent(event: IEventDoc): Promise<"scheduled" | "skipped" | "failed"> {
  if (!env.REMINDERS_ENABLED) return "skipped";
  const { reminderConfig } = event;
  if (!reminderConfig?.enabled || !reminderConfig.offsetsMinutes?.length) return "skipped";

  const queue = getReminderQueueSingleton();
  const now = Date.now();
  const eventStartMs = event.start.getTime();

  for (const offsetMinutes of reminderConfig.offsetsMinutes) {
    const runAtMs = eventStartMs - offsetMinutes * 60 * 1000;
    if (runAtMs <= now) continue;

    const jobId = `reminder:${event._id}:${offsetMinutes}`;
    const delay = runAtMs - now;

    try {
      await queue.add(
        "send_reminder_email",
        { eventId: event._id.toString(), offsetMinutes },
        { jobId, delay }
      );
    } catch (err) {
      return "failed";
    }
  }

  return "scheduled";
}
