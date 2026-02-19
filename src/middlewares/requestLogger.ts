import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { pinoHttp } from "pino-http";
import { logger } from "../config/logger.js";

const pinoMiddleware = pinoHttp({
  logger,
  genReqId: (req: Request) => (req.headers["x-request-id"] as string) || randomUUID(),
  autoLogging: true,
  customSuccessMessage: (req: Request, res: Response) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req: Request, res: Response, err?: Error) => `${req.method} ${req.url} ${res.statusCode} - ${err?.message}`,
  customAttributeKeys: {
    req: "request",
    res: "response",
  },
});

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  pinoMiddleware(req, res, () => {
    const id = (req as Request & { id?: string }).id || (req.headers["x-request-id"] as string) || randomUUID();
    res.setHeader("x-request-id", id);
    next();
  });
}
