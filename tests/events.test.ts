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

describe("POST /api/v1/events", () => {
  it("returns 400 when attendeeName is missing", async () => {
    const res = await request(app)
      .post("/api/v1/events")
      .send({
        title: "Test",
        startIso: "2027-02-19T10:00:00.000Z",
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when startIso is missing", async () => {
    const res = await request(app)
      .post("/api/v1/events")
      .send({
        attendeeName: "John",
        title: "Test",
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
