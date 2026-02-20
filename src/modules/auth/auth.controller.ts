import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as authService from "./auth.service.js";
import type { LoginInput } from "./auth.schema.js";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as LoginInput;
  const result = await authService.login(input);
  res.json({
    success: true,
    data: {
      token: result.token,
      user: {
        id: result.user._id.toString(),
        name: result.user.name,
        email: result.user.email,
        timezone: result.user.timezone,
      },
    },
  });
});
