import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as sessionsService from "./sessions.service.js";
import {
  type CreateSessionInput,
  type UpdateSessionInput,
  type ListSessionsQuery,
  ListSessionsQuerySchema,
} from "./sessions.schema.js";
import type { ISessionDoc } from "./sessions.model.js";

function toSessionResponse(session: ISessionDoc): Record<string, unknown> {
  const obj = session.toObject();
  return { ...obj, sessionId: session._id.toString() };
}

export const createSession = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateSessionInput;
  const session = await sessionsService.createSession(input, req.userId);
  res.status(201).json({ success: true, data: toSessionResponse(session) });
});

export const getSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await sessionsService.getSessionById(req.params.id, req.userId);
  res.json({ success: true, data: toSessionResponse(session) });
});

export const listSessions = asyncHandler(async (req: Request, res: Response) => {
  const query = ListSessionsQuerySchema.parse(req.query) as ListSessionsQuery;
  const { sessions, total } = await sessionsService.listSessions(query, req.userId);

  console.log(sessions, total);
  res.json({
    success: true,
    data: {
      sessions: sessions.map((s) => toSessionResponse(s)),
      pagination: { page: query.page, limit: query.limit, total },
    },
  });
});

export const updateSession = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateSessionInput;
  const session = await sessionsService.updateSession(req.params.id, input, req.userId);
  res.json({ success: true, data: toSessionResponse(session) });
});
