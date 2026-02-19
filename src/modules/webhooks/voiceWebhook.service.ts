import mongoose from "mongoose";
import { Session } from "../sessions/sessions.model.js";
import { AuditLog } from "../auditLog/auditLog.model.js";
import { AppError, ErrorCodes } from "../../utils/errors.js";
import * as eventsService from "../events/events.service.js";
import { normalizeTimezone } from "../../utils/time.js";
import { env } from "../../config/env.js";
import type { VoiceWebhookPayload } from "./voiceWebhook.schema.js";

interface ToolCallArgs {
  sessionId?: string;
  attendee_name?: string;
  attendeeName?: string;
  attendee_email?: string;
  attendeeEmail?: string;
  title?: string;
  start_iso?: string;
  startISO?: string;
  duration_minutes?: number;
  durationMinutes?: number;
  timezone?: string;
  description?: string;
  reminders_enabled?: boolean;
  remindersEnabled?: boolean;
  reminder_offsets_minutes?: number[];
  reminderOffsetsMinutes?: number[];
}

function extractToolCall(payload: VoiceWebhookPayload): { toolName: string; args: ToolCallArgs } | null {
  const toolName =
    payload.toolName ||
    payload.toolCall?.function?.name ||
    (payload.message as { toolCall?: { function?: { name?: string } } })?.toolCall?.function?.name ||
    (payload.message as { toolCalls?: Array<{ function?: { name?: string } }> })?.toolCalls?.[0]?.function?.name;

  if (!toolName) return null;

  let argsRaw: string | object | undefined =
    payload.arguments ||
    payload.toolCall?.function?.arguments ||
    (payload.message as { toolCall?: { function?: { arguments?: string | object } } })?.toolCall?.function?.arguments ||
    (payload.message as { toolCalls?: Array<{ function?: { arguments?: string | object } }> })?.toolCalls?.[0]
      ?.function?.arguments;

  const args: ToolCallArgs =
    typeof argsRaw === "string" ? (JSON.parse(argsRaw || "{}") as ToolCallArgs) : (argsRaw as ToolCallArgs) || {};

  return { toolName, args };
}

export async function handleVoiceWebhook(payload: VoiceWebhookPayload): Promise<{
  success: true;
  data: {
    status: string;
    title: string;
    attendeeName: string;
    startIso: string;
    endIso: string;
    timezone: string;
    htmlLink: string;
    googleEventId: string;
    notification?: { confirmationEmail: string; reminders: string };
    message?: string;
  };
}> {
  const extracted = extractToolCall(payload);
  if (!extracted || extracted.toolName !== "create_calendar_event") {
    return {
      success: true,
      data: {
        status: "ignored",
        title: "Meeting",
        attendeeName: "Guest",
        startIso: new Date().toISOString(),
        endIso: new Date().toISOString(),
        timezone: env.DEFAULT_TIMEZONE,
        htmlLink: "",
        googleEventId: "",
      },
    };
  }

  const { args } = extracted;
  const attendeeName = (args.attendee_name ?? args.attendeeName ?? "Guest") as string;
  const attendeeEmail = (args.attendee_email ?? args.attendeeEmail) as string | undefined;
  const title = (args.title ?? "Meeting") as string;
  const startIso = (args.start_iso ?? args.startISO) as string;
  const durationMinutes = Number(args.duration_minutes ?? args.durationMinutes ?? 30);
  const timezone = normalizeTimezone(args.timezone);
  const description = (args.description as string | undefined)?.trim();
  const remindersEnabled = args.reminders_enabled ?? args.remindersEnabled ?? true;
  const reminderOffsetsMinutes = args.reminder_offsets_minutes ?? args.reminderOffsetsMinutes;
  let sessionId = args.sessionId as string | undefined;

  if (!startIso) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, "start_iso or startISO is required", 400);
  }

  if (!sessionId && payload.type === "tool_call") {
    const session = await Session.create({
      channel: "voice",
      timezone,
      durationMinutes,
      status: "initiated",
      lastToolCallPayload: payload as unknown as Record<string, unknown>,
    });
    sessionId = session._id.toString();
  }

  const result = await eventsService.createEvent({
    sessionId,
    attendeeName,
    attendeeEmail,
    title,
    startIso,
    durationMinutes,
    timezone,
    description: description || undefined,
    remindersEnabled,
    reminderOffsetsMinutes,
  });

  await AuditLog.create({
    type: "webhook",
    sessionId: sessionId ? new mongoose.Types.ObjectId(sessionId) : undefined,
    payload: payload as unknown as Record<string, unknown>,
    message: `Voice webhook: create_calendar_event for ${attendeeName}`,
  });

  const message =
    !attendeeEmail && (result.notification.confirmationEmail === "skipped" || result.notification.reminders === "skipped")
      ? "Email skipped because no email provided."
      : undefined;

  return {
    success: true,
    data: {
      status: "confirmed",
      title: result.event.title,
      attendeeName: result.event.attendeeName,
      startIso: result.startIso,
      endIso: result.endIso,
      timezone: result.event.timezone,
      htmlLink: result.htmlLink,
      googleEventId: result.googleEventId,
      notification: result.notification,
      message,
    },
  };
}
