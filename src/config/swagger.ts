import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Voice Scheduling Agent API",
      version: "1.0.0",
      description: "REST API for voice scheduling. Creates calendar events via Google Calendar, manages sessions, and handles voice agent webhooks.",
    },
    servers: [{ url: "/api/v1", description: "API v1" }],
    components: {
      securitySchemes: {
        ApiKey: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "Optional API key for non-webhook routes",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: { type: "object" },
              },
            },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                uptime: { type: "number" },
                timestamp: { type: "string", format: "date-time" },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            timezone: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        NotificationLog: {
          type: "object",
          properties: {
            _id: { type: "string" },
            eventId: { type: "string" },
            type: { type: "string", enum: ["confirmation", "reminder"] },
            offsetMinutes: { type: "number" },
            status: { type: "string", enum: ["sent", "skipped", "failed"] },
            to: { type: "string" },
            providerMessageId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Session: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            channel: { type: "string", enum: ["web", "voice", "api"] },
            userName: { type: "string" },
            email: { type: "string" },
            meetingTitle: { type: "string" },
            timezone: { type: "string" },
            proposedStart: { type: "string", format: "date-time" },
            durationMinutes: { type: "number" },
            status: { type: "string", enum: ["initiated", "collecting", "confirmed", "booked", "failed"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Event: {
          type: "object",
          properties: {
            _id: { type: "string" },
            sessionId: { type: "string" },
            userId: { type: "string" },
            provider: { type: "string", example: "google" },
            calendarId: { type: "string" },
            title: { type: "string" },
            attendeeName: { type: "string" },
            description: { type: "string" },
            start: { type: "string", format: "date-time" },
            end: { type: "string", format: "date-time" },
            timezone: { type: "string" },
            googleEventId: { type: "string" },
            htmlLink: { type: "string" },
            notificationStatus: {
              type: "object",
              properties: {
                confirmationEmail: { type: "string", enum: ["pending", "sent", "skipped", "failed"] },
                reminders: { type: "string", enum: ["scheduled", "skipped", "failed"] },
              },
            },
            reminderConfig: {
              type: "object",
              properties: { enabled: { type: "boolean" }, offsetsMinutes: { type: "array", items: { type: "number" } } },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["src/modules/**/*.routes.ts"],
};

const spec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));
}
