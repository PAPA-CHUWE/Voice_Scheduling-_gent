import type { Request, Response, NextFunction } from "express";
import { AppError, ErrorCodes } from "../utils/errors.js";
import { env } from "../config/env.js";
import { verifyToken } from "../modules/auth/auth.service.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authOptional(req: Request, _res: Response, next: NextFunction): void {
  const apiKey = req.headers["x-api-key"];
  const authHeader = req.headers.authorization;
  const hasValidBearer =
    authHeader?.startsWith("Bearer ") &&
    (() => {
      const payload = verifyToken(authHeader.slice(7));
      if (payload) {
        (req as Request & { userId: string }).userId = payload.userId;
        return true;
      }
      return false;
    })();

  if (env.API_KEY && env.API_KEY.length > 0 && env.NODE_ENV !== "development") {
    const keyValid = apiKey && apiKey === env.API_KEY;
    if (!keyValid && !hasValidBearer) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Invalid or missing API key or Bearer token", 401);
    }
  }
  next();
}

export function requireWebhookSecret(req: Request, _res: Response, next: NextFunction): void {
  if (env.NODE_ENV === "test") {
    next();
    return;
  }
  if (!env.WEBHOOK_SECRET || env.WEBHOOK_SECRET.length === 0) {
    next();
    return;
  }
  const secret = req.headers["x-webhook-secret"] || req.body?.webhookSecret;
  if (secret !== env.WEBHOOK_SECRET) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, "Invalid webhook secret", 401);
  }
  next();
}
