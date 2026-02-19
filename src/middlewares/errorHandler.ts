import type { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.js";
import { AppError, ErrorCodes } from "../utils/errors.js";
import { env } from "../config/env.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const requestId = (res.getHeader("x-request-id") as string) || "unknown";

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
    return;
  }

  if (err instanceof Error) {
    logger.error({ err, requestId }, "Unhandled error");
    res.status(500).json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: env.NODE_ENV === "production" ? "Internal server error" : err.message,
        ...(env.NODE_ENV === "development" && err.stack && { details: { stack: err.stack } }),
      },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: "Internal server error",
    },
  });
}
