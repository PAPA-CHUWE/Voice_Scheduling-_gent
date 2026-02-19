import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";

const startTime = Date.now();

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    success: true,
    data: {
      status: "ok",
      uptime,
      timestamp: new Date().toISOString(),
    },
  });
});
