import type { Request, Response, NextFunction } from "express";

const LIST_DEFAULT_QUERY: Record<string, string> = {
  page: "1",
  limit: "20",
};

/**
 * Merges default query (and leaves params as-is) for list endpoints so logs
 * and handlers see page/limit instead of empty query.
 * Must run before requestLogger so logs show the effective request.
 */
export function defaultQueryParams(req: Request, _res: Response, next: NextFunction): void {
  if (req.method !== "GET") {
    next();
    return;
  }
  const path = (req.path || req.url?.split("?")[0] || "").replace(/\?.*/, "");
  const isListSessions = path === "/api/v1/sessions" || path === "/api/v1/sessions/";
  const isListEvents = path === "/api/v1/events" || path === "/api/v1/events/";
  if (!isListSessions && !isListEvents) {
    next();
    return;
  }
  const existing = (req.query as Record<string, string>) || {};
  req.query = { ...LIST_DEFAULT_QUERY, ...existing };
  next();
}
