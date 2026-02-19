import mongoose, { Document, Schema, Types } from "mongoose";

export type AuditLogType =
  | "webhook"
  | "event_create"
  | "event_create_requested"
  | "event_create_google_success"
  | "event_create_google_failure"
  | "email_confirmation_sent"
  | "email_confirmation_skipped"
  | "email_confirmation_failed"
  | "reminders_scheduled"
  | "reminders_skipped"
  | "reminders_failed"
  | "reminder_sent"
  | "reminder_skipped"
  | "reminder_failed"
  | "error"
  | "info";

export interface IAuditLog {
  type: AuditLogType;
  sessionId?: Types.ObjectId;
  eventId?: Types.ObjectId;
  payload?: Record<string, unknown>;
  message?: string;
}

export interface IAuditLogDoc extends IAuditLog, Document {
  _id: Types.ObjectId;
  createdAt: Date;
}

const AUDIT_TYPES = [
  "webhook", "event_create", "event_create_requested", "event_create_google_success", "event_create_google_failure",
  "email_confirmation_sent", "email_confirmation_skipped", "email_confirmation_failed",
  "reminders_scheduled", "reminders_skipped", "reminders_failed",
  "reminder_sent", "reminder_skipped", "reminder_failed",
  "error", "info",
] as const;

const AuditLogSchema = new Schema<IAuditLogDoc>(
  {
    type: { type: String, enum: AUDIT_TYPES, required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session" },
    eventId: { type: Schema.Types.ObjectId, ref: "Event" },
    payload: { type: Object },
    message: { type: String },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ sessionId: 1 });
AuditLogSchema.index({ eventId: 1 });
AuditLogSchema.index({ type: 1 });

export const AuditLog = mongoose.model<IAuditLogDoc>("AuditLog", AuditLogSchema);
