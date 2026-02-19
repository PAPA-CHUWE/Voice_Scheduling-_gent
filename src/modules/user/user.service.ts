import mongoose from "mongoose";
import { User, type IUserDoc } from "./user.model.js";
import { env } from "../../config/env.js";

export interface UpsertUserInput {
  name: string;
  email?: string;
  phone?: string;
  timezone?: string;
}

/** Create or update user by email. If email is provided, upsert by email; otherwise create new user with name only. */
export async function upsertUser(input: UpsertUserInput): Promise<IUserDoc> {
  const timezone = input.timezone ?? env.DEFAULT_TIMEZONE;
  if (input.email?.trim()) {
    const existing = await User.findOne({ email: input.email.trim() });
    if (existing) {
      existing.name = input.name;
      if (input.phone !== undefined) existing.phone = input.phone;
      existing.timezone = timezone;
      existing.updatedAt = new Date();
      await existing.save();
      return existing;
    }
    const created = await User.create({
      name: input.name,
      email: input.email.trim(),
      phone: input.phone,
      timezone,
    });
    return created;
  }
  return User.create({
    name: input.name,
    timezone,
    phone: input.phone,
  });
}

export async function getUserById(id: string): Promise<IUserDoc | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  return User.findById(id);
}
