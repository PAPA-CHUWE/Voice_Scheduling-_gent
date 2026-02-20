import mongoose from "mongoose";
import { Event, type IEventDoc } from "./events.model.js";
import { Session, type ISessionDoc } from "../sessions/sessions.model.js";
import type { IUserDoc } from "../user/user.model.js";
import { AuditLog } from "../auditLog/auditLog.model.js";
import { createCalendarEvent } from "../integrations/google/googleCalendar.service.js";
import * as userService from "../user/user.service.js";
import * as emailService from "../notifications/email/email.service.js";
import { scheduleRemindersForEvent } from "../notifications/queue/scheduleReminders.js";
import type { CreateEventInput, ListEventsQuery } from "./events.schema.js";
import { AppError, ErrorCodes } from "../../utils/errors.js";
import { env } from "../../config/env.js";
import { isValidISO, isStartInFuture, normalizeTimezone } from "../../utils/time.js";

export interface CreateEventResult {
  event: IEventDoc;
  startIso: string;
  endIso: string;
  googleEventId: string;
  htmlLink: string;
  calendarId: string;
  notification: {
    confirmationEmail: "sent" | "skipped" | "failed" | "pending";
    reminders: "scheduled" | "skipped" | "failed" | "pending";
  };
}

/** Run email + reminders in background and update event. Used to avoid request timeouts on Render. */
function runNotificationsInBackground(
  event: IEventDoc,
  user: IUserDoc,
  toEmail: string | undefined,
  reminderConfig: { enabled: boolean; offsetsMinutes: number[] },
  sessionId: mongoose.Types.ObjectId | undefined
): void {
  void (async () => {
    let confirmationStatus: "sent" | "skipped" | "failed" = "skipped";
    let remindersStatus: "scheduled" | "skipped" | "failed" = "skipped";
    try {
      if (toEmail && env.EMAIL_ENABLED) {
        confirmationStatus = await emailService.sendEventCreatedEmail(event, user, toEmail);
      } else if (!toEmail) {
        await AuditLog.create({
          type: "email_confirmation_skipped",
          eventId: event._id,
          sessionId,
          payload: { reason: "no_email" },
          message: "Confirmation email skipped: no email provided",
        });
      }
    } catch {
      confirmationStatus = "failed";
    }
    try {
      if (reminderConfig.enabled && toEmail && env.REMINDERS_ENABLED) {
        remindersStatus = await scheduleRemindersForEvent(event);
        if (remindersStatus === "scheduled") {
          await AuditLog.create({
            type: "reminders_scheduled",
            eventId: event._id,
            payload: { eventId: event._id, offsetsMinutes: reminderConfig.offsetsMinutes },
            message: `Reminders scheduled for event ${event._id}`,
          });
        } else if (remindersStatus === "failed") {
          await AuditLog.create({
            type: "reminders_failed",
            eventId: event._id,
            payload: { eventId: event._id },
            message: "Failed to schedule reminder jobs",
          });
        }
      } else if (reminderConfig.enabled && !toEmail) {
        await AuditLog.create({
          type: "reminders_skipped",
          eventId: event._id,
          payload: { reason: "no_email" },
          message: "Reminders skipped: no email provided",
        });
      }
    } catch {
      remindersStatus = "failed";
    }
    const updated = await Event.findById(event._id);
    if (updated) {
      updated.notificationStatus.confirmationEmail = confirmationStatus;
      updated.notificationStatus.reminders = remindersStatus;
      await updated.save();
    }
  })();
}

export async function createEvent(
  input: CreateEventInput & { idempotencyKey?: string; createdByUserId?: string }
): Promise<CreateEventResult> {
  if (!isValidISO(input.startIso)) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, "startIso must be a valid ISO 8601 datetime", 400);
  }
  if (!isStartInFuture(input.startIso)) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, "startIso must be in the future", 400);
  }

  const timezone = normalizeTimezone(input.timezone);
  const calendarId = input.calendarId || env.GOOGLE_CALENDAR_ID;

  if (input.idempotencyKey?.trim()) {
    const existing = await Event.findOne({ idempotencyKey: input.idempotencyKey.trim() });
    if (existing) {
      const startIso = existing.start.toISOString();
      const endIso = existing.end.toISOString();
      return {
        event: existing,
        startIso,
        endIso,
        googleEventId: existing.googleEventId ?? "",
        htmlLink: existing.htmlLink ?? "",
        calendarId: existing.calendarId,
        notification: {
          confirmationEmail: existing.notificationStatus.confirmationEmail === "sent" ? "sent" : "skipped",
          reminders: existing.notificationStatus.reminders === "scheduled" ? "scheduled" : "skipped",
        },
      };
    }
  }

  const user = await userService.upsertUser({
    name: input.attendeeName,
    email: input.attendeeEmail,
    timezone,
  });

  let sessionId: mongoose.Types.ObjectId | undefined;
  let sessionDoc: ISessionDoc | null = null;
  if (input.sessionId && mongoose.isValidObjectId(input.sessionId)) {
    sessionId = new mongoose.Types.ObjectId(input.sessionId);
    sessionDoc = await Session.findById(sessionId);
    if (!sessionDoc) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Session not found", 404);
    }
  }

  const reminderConfig = {
    enabled: input.remindersEnabled ?? true,
    offsetsMinutes: input.reminderOffsetsMinutes ?? [60, 10],
  };

  let event: IEventDoc;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      event = await Event.create(
        [
          {
            sessionId,
            userId: user._id,
            createdBy: input.createdByUserId && mongoose.isValidObjectId(input.createdByUserId)
              ? new mongoose.Types.ObjectId(input.createdByUserId)
              : undefined,
            provider: "google",
            calendarId,
            title: input.title,
            attendeeName: input.attendeeName,
            description: input.description,
            start: new Date(input.startIso),
            end: new Date(input.startIso),
            timezone,
            notificationStatus: { confirmationEmail: "pending", reminders: "skipped" },
            reminderConfig,
            idempotencyKey: input.idempotencyKey?.trim() || undefined,
          },
        ],
        { session }
      ).then((arr) => arr[0]!);

      await AuditLog.create(
        [
          {
            type: "event_create_requested",
            sessionId,
            eventId: event._id,
            payload: { eventId: event._id, input: { ...input, idempotencyKey: undefined } },
            message: `Event create requested for ${input.attendeeName}`,
          },
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  event = (await Event.findById(event!._id))!;

  let googleResult: { googleEventId: string; htmlLink: string; start: string; end: string };
  try {
    googleResult = await createCalendarEvent({
      title: input.title,
      attendeeName: input.attendeeName,
      description: input.description,
      startIso: input.startIso,
      durationMinutes: input.durationMinutes,
      timezone,
      calendarId,
    });
  } catch (err) {
    await AuditLog.create({
      type: "event_create_google_failure",
      eventId: event._id,
      sessionId,
      payload: { eventId: event._id, error: err instanceof Error ? err.message : String(err) },
      message: "Google Calendar create failed",
    });
    throw err;
  }

  event.googleEventId = googleResult.googleEventId;
  event.htmlLink = googleResult.htmlLink;
  event.end = new Date(googleResult.end);
  event.rawResponse = googleResult as unknown as Record<string, unknown>;
  await event.save();

  await AuditLog.create({
    type: "event_create_google_success",
    eventId: event._id,
    sessionId,
    payload: { eventId: event._id, googleEventId: googleResult.googleEventId },
    message: `Google event created: ${googleResult.googleEventId}`,
  });

  const toEmail = emailService.getRecipientEmail(event, user);

  if (sessionDoc) {
    sessionDoc.status = "booked";
    sessionDoc.userId = user._id;
    sessionDoc.userName = input.attendeeName;
    sessionDoc.email = user.email;
    sessionDoc.meetingTitle = input.title;
    sessionDoc.proposedStart = new Date(input.startIso);
    sessionDoc.timezone = timezone;
    await sessionDoc.save();
  }

  runNotificationsInBackground(event, user, toEmail ?? undefined, reminderConfig, sessionDoc?._id);

  return {
    event,
    startIso: googleResult.start,
    endIso: googleResult.end,
    googleEventId: googleResult.googleEventId,
    htmlLink: googleResult.htmlLink,
    calendarId,
    notification: {
      confirmationEmail: "pending",
      reminders: "pending",
    },
  };
}

export async function getEventById(id: string, userId?: string): Promise<IEventDoc> {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Event not found", 404);
  }
  const event = await Event.findById(id);
  if (!event) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Event not found", 404);
  }
  if (userId) {
    const isOwner = event.userId?.toString() === userId;
    const isCreator = event.createdBy?.toString() === userId;
    const legacyEvent = event.createdBy == null; // old events before createdBy existed
    if (!isOwner && !isCreator && !legacyEvent) {
      throw new AppError(ErrorCodes.FORBIDDEN, "You do not have access to this event", 403);
    }
  }
  return event;
}

export async function deleteEventById(id: string, userId?: string): Promise<void> {
  const event = await getEventById(id, userId);
  await Event.findByIdAndDelete(event._id);
}

export async function listEvents(
  query: ListEventsQuery,
  userId?: string
): Promise<{ events: IEventDoc[]; total: number }> {
  const filter: Record<string, unknown> = {};
  const hasSessionId = query.sessionId && mongoose.isValidObjectId(query.sessionId);

  if (hasSessionId) {
    filter.sessionId = new mongoose.Types.ObjectId(query.sessionId!);
    if (userId) {
      const session = await Session.findById(query.sessionId);
      if (!session || session.userId?.toString() !== userId) {
        return { events: [], total: 0 };
      }
    }
  } else if (userId) {
    // Include events where user is attendee, creator, or legacy (no createdBy)
    filter.$or = [
      { userId: new mongoose.Types.ObjectId(userId) },
      { createdBy: new mongoose.Types.ObjectId(userId) },
      { createdBy: null },
      { createdBy: { $exists: false } },
    ];
  }

  const [events, total] = await Promise.all([
    Event.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    Event.countDocuments(filter),
  ]);

  return { events, total };
}
