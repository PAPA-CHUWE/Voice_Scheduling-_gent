import mongoose from "mongoose";
import { Session, type ISessionDoc } from "./sessions.model.js";
import * as userService from "../user/user.service.js";
import type { CreateSessionInput, UpdateSessionInput, ListSessionsQuery } from "./sessions.schema.js";
import { AppError, ErrorCodes } from "../../utils/errors.js";
import { env } from "../../config/env.js";

export async function createSession(input: CreateSessionInput): Promise<ISessionDoc> {
  const timezone = input.timezone || env.DEFAULT_TIMEZONE;
  let userId: mongoose.Types.ObjectId | undefined;
  if (input.userName || input.email) {
    const user = await userService.upsertUser({
      name: input.userName ?? "Guest",
      email: input.email,
      timezone,
    });
    userId = user._id;
  }
  const session = await Session.create({
    channel: input.channel,
    userId,
    userName: input.userName,
    email: input.email,
    timezone,
    durationMinutes: input.durationMinutes,
    meetingTitle: input.meetingTitle,
    proposedStart: input.proposedStartIso ? new Date(input.proposedStartIso) : undefined,
    status: "initiated",
  });
  return session;
}

export async function getSessionById(id: string): Promise<ISessionDoc> {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Session not found", 404);
  }
  const session = await Session.findById(id);
  if (!session) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Session not found", 404);
  }
  return session;
}

export async function listSessions(query: ListSessionsQuery): Promise<{ sessions: ISessionDoc[]; total: number }> {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;

  const [sessions, total] = await Promise.all([
    Session.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    Session.countDocuments(filter),
  ]);

  return { sessions, total };
}

export async function updateSession(id: string, input: UpdateSessionInput): Promise<ISessionDoc> {
  const session = await getSessionById(id);

  if (input.userName !== undefined) session.userName = input.userName;
  if (input.meetingTitle !== undefined) session.meetingTitle = input.meetingTitle;
  if (input.durationMinutes !== undefined) session.durationMinutes = input.durationMinutes;
  if (input.status !== undefined) session.status = input.status;
  if (input.proposedStartIso !== undefined) session.proposedStart = new Date(input.proposedStartIso);
  if (input.email !== undefined) {
    session.email = input.email;
    if (input.email || input.userName) {
      const user = await userService.upsertUser({
        name: input.userName ?? session.userName ?? "Guest",
        email: input.email,
        timezone: session.timezone,
      });
      session.userId = user._id;
    }
  }
  if (input.userName !== undefined && session.userId) {
    const user = await userService.getUserById(session.userId.toString());
    if (user) {
      user.name = input.userName;
      await user.save();
    }
  }

  await session.save();
  return session;
}
