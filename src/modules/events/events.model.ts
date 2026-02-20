import mongoose, { Document, Schema, Types } from "mongoose";

export type ConfirmationEmailStatus = "pending" | "sent" | "skipped" | "failed";
export type RemindersStatus = "scheduled" | "skipped" | "failed";

export interface IEventNotificationStatus {
  confirmationEmail: ConfirmationEmailStatus;
  reminders: RemindersStatus;
}

export interface IEventReminderConfig {
  enabled: boolean;
  offsetsMinutes: number[];
}

export interface IEvent {
  sessionId?: Types.ObjectId;
  userId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  provider: "google";
  calendarId: string;
  title: string;
  attendeeName: string;
  description?: string;
  start: Date;
  end: Date;
  timezone: string;
  googleEventId?: string;
  htmlLink?: string;
  rawResponse?: Record<string, unknown>;
  notificationStatus: IEventNotificationStatus;
  reminderConfig: IEventReminderConfig;
  idempotencyKey?: string;
}

export interface IEventDoc extends IEvent, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEventDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    provider: { type: String, default: "google" },
    calendarId: { type: String, required: true },
    title: { type: String, required: true },
    attendeeName: { type: String, required: true },
    description: { type: String },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    timezone: { type: String, required: true },
    googleEventId: { type: String },
    htmlLink: { type: String },
    rawResponse: { type: Object },
    notificationStatus: {
      type: {
        confirmationEmail: {
          type: String,
          enum: ["pending", "sent", "skipped", "failed"],
          default: "pending",
        },
        reminders: {
          type: String,
          enum: ["scheduled", "skipped", "failed"],
          default: "skipped",
        },
      },
      default: () => ({ confirmationEmail: "pending", reminders: "skipped" }),
    },
    reminderConfig: {
      type: {
        enabled: { type: Boolean, default: true },
        offsetsMinutes: { type: [Number], default: [60, 10] },
      },
      default: () => ({ enabled: true, offsetsMinutes: [60, 10] }),
    },
    idempotencyKey: { type: String },
  },
  { timestamps: true }
);

EventSchema.index({ sessionId: 1, createdAt: -1 });
EventSchema.index({ userId: 1, createdAt: -1 });
EventSchema.index({ start: 1 });
EventSchema.index({ googleEventId: 1 }, { unique: true, sparse: true });
EventSchema.index({ createdAt: -1 });

export const Event = mongoose.model<IEventDoc>("Event", EventSchema);
