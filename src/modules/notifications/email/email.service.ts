import { env } from "../../../config/env.js";
import { logger } from "../../../config/logger.js";
import { AuditLog } from "../../auditLog/auditLog.model.js";
import { NotificationLog } from "../notificationLog.model.js";
import type { IEventDoc } from "../../events/events.model.js";
import type { IUserDoc } from "../../user/user.model.js";
import { formatInTimezone } from "../../../utils/time.js";
import { resendProvider } from "./resend.provider.js";
import type { EmailProvider } from "./email.types.js";
import { renderEventCreated } from "./templates/eventCreated.js";
import { renderReminder } from "./templates/reminder.js";

const emailProvider: EmailProvider = resendProvider;

const IDEMPOTENCY_PREFIX_CONFIRMATION = "confirmation:";
const IDEMPOTENCY_PREFIX_REMINDER = "reminder:";

export async function sendEventCreatedEmail(
  event: IEventDoc,
  user: IUserDoc | null,
  toEmail: string
): Promise<"sent" | "skipped" | "failed"> {
  if (!env.EMAIL_ENABLED || !env.RESEND_API_KEY) {
    return "skipped";
  }
  const idempotencyKey = `${IDEMPOTENCY_PREFIX_CONFIRMATION}${event._id}`;
  const existing = await NotificationLog.findOne({
    eventId: event._id,
    type: "confirmation",
    status: "sent",
  });
  if (existing) {
    return "sent";
  }

  const startFormatted = formatInTimezone(event.start, event.timezone);
  const endFormatted = formatInTimezone(event.end, event.timezone);
  const { html, text } = renderEventCreated({
    title: event.title,
    description: event.description,
    startFormatted,
    endFormatted,
    htmlLink: event.htmlLink,
    attendeeName: event.attendeeName,
  });

  try {
    const result = await emailProvider.sendEmail({
      to: toEmail,
      subject: `Event confirmed: ${event.title}`,
      text,
      html,
      idempotencyKey,
    });
    await NotificationLog.create({
      eventId: event._id,
      type: "confirmation",
      status: "sent",
      to: toEmail,
      providerMessageId: result.providerMessageId,
    });
    await AuditLog.create({
      type: "email_confirmation_sent",
      eventId: event._id,
      sessionId: event.sessionId,
      payload: { to: toEmail, providerMessageId: result.providerMessageId },
      message: `Confirmation email sent for event ${event._id}`,
    });
    return "sent";
  } catch (err) {
    logger.error({ err, eventId: event._id, to: toEmail }, "Confirmation email failed");
    await NotificationLog.create({
      eventId: event._id,
      type: "confirmation",
      status: "failed",
      to: toEmail,
      error: err instanceof Error ? { message: err.message } : { err: String(err) },
    });
    await AuditLog.create({
      type: "email_confirmation_failed",
      eventId: event._id,
      sessionId: event.sessionId,
      payload: { to: toEmail, error: err instanceof Error ? err.message : String(err) },
      message: `Confirmation email failed for event ${event._id}`,
    });
    return "failed";
  }
}

export async function sendReminderEmail(
  event: IEventDoc,
  toEmail: string,
  offsetMinutes: number
): Promise<"sent" | "skipped" | "failed"> {
  if (!env.EMAIL_ENABLED || !env.RESEND_API_KEY) {
    return "skipped";
  }
  const idempotencyKey = `${IDEMPOTENCY_PREFIX_REMINDER}${event._id}:${offsetMinutes}`;
  const existing = await NotificationLog.findOne({
    eventId: event._id,
    type: "reminder",
    offsetMinutes,
    status: "sent",
  });
  if (existing) return "sent";

  const startFormatted = formatInTimezone(event.start, event.timezone);
  const endFormatted = formatInTimezone(event.end, event.timezone);
  const { html, text } = renderReminder({
    title: event.title,
    startFormatted,
    endFormatted,
    htmlLink: event.htmlLink,
    attendeeName: event.attendeeName,
    minutesUntil: offsetMinutes,
  });

  try {
    const result = await emailProvider.sendEmail({
      to: toEmail,
      subject: `Reminder: ${event.title} in ${offsetMinutes} minutes`,
      text,
      html,
      idempotencyKey,
    });
    await NotificationLog.create({
      eventId: event._id,
      type: "reminder",
      offsetMinutes,
      status: "sent",
      to: toEmail,
      providerMessageId: result.providerMessageId,
    });
    await AuditLog.create({
      type: "reminder_sent",
      eventId: event._id,
      payload: { to: toEmail, offsetMinutes, providerMessageId: result.providerMessageId },
      message: `Reminder sent for event ${event._id} (${offsetMinutes} min)`,
    });
    return "sent";
  } catch (err) {
    logger.error({ err, eventId: event._id, offsetMinutes }, "Reminder email failed");
    await NotificationLog.create({
      eventId: event._id,
      type: "reminder",
      offsetMinutes,
      status: "failed",
      to: toEmail,
      error: err instanceof Error ? { message: err.message } : { err: String(err) },
    });
    await AuditLog.create({
      type: "reminder_failed",
      eventId: event._id,
      payload: { to: toEmail, offsetMinutes, error: err instanceof Error ? err.message : String(err) },
      message: `Reminder failed for event ${event._id}`,
    });
    return "failed";
  }
}

export function getRecipientEmail(event: IEventDoc, user: IUserDoc | null): string | null {
  if (user?.email) return user.email;
  return null;
}
