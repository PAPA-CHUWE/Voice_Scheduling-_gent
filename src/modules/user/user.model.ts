import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUser {
  name: string;
  email?: string;
  phone?: string;
  timezone: string;
}

export interface IUserDoc extends IUser, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDoc>(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    timezone: { type: String, required: true, default: "Africa/Harare" },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ createdAt: -1 });


export const User = mongoose.model<IUserDoc>("User", UserSchema);
