import mongoose, { Document, Schema, Types } from "mongoose";

export type NotificationLogType = "confirmation" | "reminder";
export type NotificationLogStatus = "sent" | "skipped" | "failed";

export interface INotificationLog {
  eventId: Types.ObjectId;
  type: NotificationLogType;
  offsetMinutes?: number;
  status: NotificationLogStatus;
  to: string;
  providerMessageId?: string;
  error?: Record<string, unknown>;
}

export interface INotificationLogDoc extends INotificationLog, Document {
  _id: Types.ObjectId;
  createdAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLogDoc>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    type: { type: String, enum: ["confirmation", "reminder"], required: true },
    offsetMinutes: { type: Number },
    status: { type: String, enum: ["sent", "skipped", "failed"], required: true },
    to: { type: String, required: true },
    providerMessageId: { type: String },
    error: { type: Object },
  },
  { timestamps: true }
);

NotificationLogSchema.index({ eventId: 1, type: 1, offsetMinutes: 1 });
NotificationLogSchema.index({ createdAt: -1 });

export const NotificationLog = mongoose.model<INotificationLogDoc>("NotificationLog", NotificationLogSchema);
