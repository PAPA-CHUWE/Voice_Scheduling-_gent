import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as voiceWebhookService from "./voiceWebhook.service.js";
import { VoiceWebhookSchema } from "./voiceWebhook.schema.js";
import { AuditLog } from "../auditLog/auditLog.model.js";
import { AppError, ErrorCodes } from "../../utils/errors.js";
import mongoose from "mongoose";

export const handleVoiceWebhook = asyncHandler(async (req: Request, res: Response) => {
  const parsed = VoiceWebhookSchema.safeParse(req.body);
  if (!parsed.success) {
    await AuditLog.create({
      type: "error",
      payload: req.body,
      message: "Voice webhook validation failed",
    });
    throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid webhook payload", 400, parsed.error.flatten());
  }

  try {
    const result = await voiceWebhookService.handleVoiceWebhook(parsed.data);
    res.json(result);
  } catch (err) {
    await AuditLog.create({
      type: "error",
      payload: req.body,
      message: err instanceof Error ? err.message : "Voice webhook failed",
    });
    if (err instanceof AppError) throw err;
    throw new AppError(
      ErrorCodes.CALENDAR_CREATE_FAILED,
      err instanceof Error ? err.message : "Failed to create calendar event",
      502,
      err
    );
  }
});
