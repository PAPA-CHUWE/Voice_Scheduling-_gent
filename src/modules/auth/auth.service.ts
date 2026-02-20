import jwt from "jsonwebtoken";
import * as userService from "../user/user.service.js";
import type { IUserDoc } from "../user/user.model.js";
import type { LoginInput } from "./auth.schema.js";
import { AppError, ErrorCodes } from "../../utils/errors.js";
import { env } from "../../config/env.js";

export interface LoginResult {
  token: string;
  user: IUserDoc;
}

export async function login(input: LoginInput): Promise<LoginResult> {
  if (!env.JWT_SECRET?.length) {
    throw new AppError(ErrorCodes.INTERNAL_ERROR, "Login is not configured (JWT_SECRET missing)", 503);
  }
  const user = await userService.getUserByEmail(input.email);
  const resolved =
    user ?? (await userService.upsertUser({ name: input.email.split("@")[0] ?? "User", email: input.email }));
  const token = jwt.sign(
    { userId: resolved._id.toString(), email: resolved.email },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return { token, user: resolved };
}

export function verifyToken(bearerToken: string): { userId: string } | null {
  if (!env.JWT_SECRET?.length) return null;
  try {
    const payload = jwt.verify(bearerToken, env.JWT_SECRET) as { userId?: string };
    return payload.userId ? { userId: payload.userId } : null;
  } catch {
    return null;
  }
}
