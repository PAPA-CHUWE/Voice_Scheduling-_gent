import { google } from "googleapis";
import { getGoogleOAuth2Client } from "./googleClient.js";
import { env } from "../../../config/env.js";
import { logger } from "../../../config/logger.js";
import { AppError, ErrorCodes } from "../../../utils/errors.js";
import { addMinutes } from "../../../utils/time.js";

export interface CreateCalendarEventParams {
  title: string;
  attendeeName: string;
  attendeeEmail?: string;
  description?: string;
  startIso: string;
  durationMinutes: number;
  timezone: string;
  calendarId?: string;
}

export interface CreateCalendarEventResult {
  googleEventId: string;
  htmlLink: string;
  start: string;
  end: string;
}

export async function createCalendarEvent(params: CreateCalendarEventParams): Promise<CreateCalendarEventResult> {
  const { title, attendeeName, attendeeEmail, description, startIso, durationMinutes, timezone } = params;
  const calendarId = params.calendarId || env.GOOGLE_CALENDAR_ID;
  const descriptionText = description?.trim() || `Scheduled by voice agent for ${attendeeName}`;

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REFRESH_TOKEN) {
    throw new AppError(
      ErrorCodes.CALENDAR_CREATE_FAILED,
      "Google Calendar is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN.",
      503
    );
  }

  const auth = getGoogleOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });
  const endIso = addMinutes(startIso, durationMinutes);

  const requestBody = {
    summary: title,
    description: descriptionText,
    start: { dateTime: startIso, timeZone: timezone },
    end: { dateTime: endIso, timeZone: timezone },
    ...(attendeeEmail?.trim()
      ? { attendees: [{ email: attendeeEmail.trim(), displayName: attendeeName }] }
      : {}),
  };

  const sendUpdates = attendeeEmail?.trim() ? "all" : "none";
  logger.info({ title, startIso, calendarId, sendUpdates }, "Creating Google Calendar event");

  try {
    const res = await calendar.events.insert({
      calendarId,
      requestBody,
      sendUpdates,
    });

    const eventId = res.data.id;
    const htmlLink = res.data.htmlLink;

    if (!eventId || !htmlLink) {
      throw new AppError(ErrorCodes.CALENDAR_CREATE_FAILED, "Google Calendar returned incomplete response", 502);
    }

    return {
      googleEventId: eventId,
      htmlLink,
      start: startIso,
      end: endIso,
    };
  } catch (err: unknown) {
    const gaxios = err as { response?: { data?: { error?: string } }; message?: string };
    const googleError = gaxios.response?.data?.error ?? gaxios.message ?? "";
    const isInvalidGrant =
      googleError === "invalid_grant" || String(gaxios.message || "").toLowerCase().includes("invalid_grant");

    const message = isInvalidGrant
      ? "Google OAuth refresh token is invalid or expired. Re-run the OAuth flow and set GOOGLE_REFRESH_TOKEN in .env."
      : err instanceof Error
        ? err.message
        : "Google Calendar API error";

    logger.error({ err, title, startIso }, "Google Calendar create failed");
    throw new AppError(ErrorCodes.CALENDAR_CREATE_FAILED, message, 502);
  }
}
