import request from "supertest";
import app from "../src/app.js";

jest.mock("../src/modules/integrations/google/googleCalendar.service.js", () => ({
  createCalendarEvent: jest.fn().mockResolvedValue({
    googleEventId: "mock-google-id",
    htmlLink: "https://calendar.google.com/mock",
    start: "2027-02-19T10:00:00.000Z",
    end: "2027-02-19T10:30:00.000Z",
  }),
}));

jest.mock("../src/modules/events/events.service.js", () => ({
  createEvent: jest.fn().mockResolvedValue({
    event: {
      _id: "507f1f77bcf86cd799439011",
      title: "Demo Call",
      attendeeName: "Jane",
      timezone: "Africa/Harare",
      htmlLink: "https://calendar.google.com/mock",
      googleEventId: "mock-google-id",
    },
    startIso: "2027-02-19T14:00:00.000Z",
    endIso: "2027-02-19T14:30:00.000Z",
    htmlLink: "https://calendar.google.com/mock",
    googleEventId: "mock-google-id",
    notification: { confirmationEmail: "skipped", reminders: "skipped" },
  }),
}));

jest.mock("../src/modules/sessions/sessions.model.js", () => ({
  Session: {
    create: jest.fn().mockResolvedValue({
      _id: { toString: () => "507f1f77bcf86cd799439011" },
    }),
  },
}));

jest.mock("../src/modules/auditLog/auditLog.model.js", () => ({
  AuditLog: { create: jest.fn().mockResolvedValue({}) },
}));

describe("POST /api/v1/webhooks/voice", () => {
  it("returns 400 when start_iso is missing", async () => {
    const res = await request(app)
      .post("/api/v1/webhooks/voice")
      .send({
        type: "tool_call",
        toolName: "create_calendar_event",
        arguments: {
          attendee_name: "John",
          title: "Meeting",
        },
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("creates event and returns 200 when payload is valid (mocked)", async () => {
    const res = await request(app)
      .post("/api/v1/webhooks/voice")
      .send({
        type: "tool_call",
        toolName: "create_calendar_event",
        arguments: {
          attendee_name: "Jane",
          title: "Demo Call",
          start_iso: "2027-02-19T14:00:00.000Z",
          duration_minutes: 30,
          timezone: "Africa/Harare",
        },
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("confirmed");
    expect(res.body.data.attendeeName).toBe("Jane");
    expect(res.body.data.notification).toEqual({ confirmationEmail: "skipped", reminders: "skipped" });
  });
});
