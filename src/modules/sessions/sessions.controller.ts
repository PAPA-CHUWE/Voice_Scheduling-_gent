import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as sessionsService from "./sessions.service.js";
import type { CreateSessionInput, UpdateSessionInput, ListSessionsQuery } from "./sessions.schema.js";

export const createSession = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateSessionInput;
  const session = await sessionsService.createSession(input);
  res.status(201).json({ success: true, data: session });
});

export const getSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await sessionsService.getSessionById(req.params.id);
  res.json({ success: true, data: session });
});

export const listSessions = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListSessionsQuery;
  const { sessions, total } = await sessionsService.listSessions(query);
  res.json({
    success: true,
    data: {
      sessions,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    },
  });
});

export const updateSession = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateSessionInput;
  const session = await sessionsService.updateSession(req.params.id, input);
  res.json({ success: true, data: session });
});
