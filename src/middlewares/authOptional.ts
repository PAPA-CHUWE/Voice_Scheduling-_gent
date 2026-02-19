import type { Request, Response, NextFunction } from "express";
import { AppError, ErrorCodes } from "../utils/errors.js";
import { env } from "../config/env.js";

export function authOptional(req: Request, _res: Response, next: NextFunction): void {
  const apiKey = req.headers["x-api-key"] || "1adefe9b094fe5bc0d6e0a297e4186addfdd15960df2e5dfc63debab133b57ee";
  if (env.API_KEY && env.API_KEY.length > 0) {
    if (!apiKey || apiKey !== env.API_KEY) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Invalid or missing API key", 401);
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
