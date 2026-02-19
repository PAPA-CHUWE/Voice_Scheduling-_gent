import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";
import { AppError, ErrorCodes } from "../utils/errors.js";

type Source = "body" | "query";

export function validate(schema: z.ZodType<unknown>, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = source === "body" ? req.body : req.query;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Validation failed", 400, parsed.error.flatten());
    }
    if (source === "body") {
      req.body = parsed.data;
    } else {
      req.query = parsed.data as typeof req.query;
    }
    next();
  };
}
