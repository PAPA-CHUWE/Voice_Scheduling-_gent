import mongoose, { Document, Schema, Types } from "mongoose";

export type SessionChannel = "web" | "voice" | "api";
export type SessionStatus = "initiated" | "collecting" | "confirmed" | "booked" | "failed";

export interface ISession {
  channel: SessionChannel;
  userId?: Types.ObjectId;
  userName?: string;
  email?: string;
  meetingTitle?: string;
  timezone: string;
  proposedStart?: Date;
  durationMinutes: number;
  status: SessionStatus;
  lastToolCallPayload?: Record<string, unknown>;
}

export interface ISessionDoc extends ISession, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISessionDoc>(
  {
    channel: { type: String, enum: ["web", "voice", "api"], default: "voice" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    userName: { type: String },
    email: { type: String },
    meetingTitle: { type: String },
    timezone: { type: String, required: true, default: "Africa/Harare" },
    proposedStart: { type: Date },
    durationMinutes: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ["initiated", "collecting", "confirmed", "booked", "failed"],
      default: "initiated",
    },
    lastToolCallPayload: { type: Object },
  },
  { timestamps: true }
);

SessionSchema.index({ status: 1 });
SessionSchema.index({ createdAt: -1 });

export const Session = mongoose.model<ISessionDoc>("Session", SessionSchema);
