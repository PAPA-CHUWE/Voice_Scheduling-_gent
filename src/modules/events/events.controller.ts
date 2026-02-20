import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as eventsService from "./events.service.js";
import type { CreateEventInput, ListEventsQuery } from "./events.schema.js";

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateEventInput;
  const idempotencyKey = (req.headers["x-idempotency-key"] as string)?.trim();
  const result = await eventsService.createEvent({
    ...input,
    idempotencyKey: idempotencyKey || undefined,
    createdByUserId: req.userId,
  });
  res.status(201).json({
    success: true,
    data: {
      eventId: result.event._id,
      sessionId: result.event.sessionId,
      provider: "google",
      googleEventId: result.googleEventId,
      htmlLink: result.htmlLink,
      startIso: result.startIso,
      endIso: result.endIso,
      timezone: result.event.timezone,
      calendarId: result.calendarId,
      notification: result.notification,
    },
  });
});

export const getEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await eventsService.getEventById(req.params.id, req.userId);
  res.json({ success: true, data: event });
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  await eventsService.deleteEventById(req.params.id, req.userId);
  res.status(204).send();
});

export const listEvents = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListEventsQuery;
  const { events, total } = await eventsService.listEvents(query, req.userId);
  res.json({
    success: true,
    data: {
      events,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    },
  });
});
