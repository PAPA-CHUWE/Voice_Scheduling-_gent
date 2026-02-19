import { Queue } from "bullmq";
import { getRedisConnectionOptions } from "../../../config/redis.js";

export const REMINDER_QUEUE_NAME = "reminders";

export interface ReminderJobData {
  eventId: string;
  offsetMinutes: number;
}

export function getReminderQueue(): Queue<ReminderJobData> {
  const conn = getRedisConnectionOptions();
  return new Queue<ReminderJobData>(REMINDER_QUEUE_NAME, {
    connection: conn,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: { count: 1000 },
    },
  });
}

let reminderQueueInstance: Queue<ReminderJobData> | null = null;

export function getReminderQueueSingleton(): Queue<ReminderJobData> {
  if (!reminderQueueInstance) {
    reminderQueueInstance = getReminderQueue();
  }
  return reminderQueueInstance;
}
