/**
 * Unit tests for createCalendarEvent: attendees and sendUpdates behavior.
 */
const mockInsert = jest.fn();

jest.mock("googleapis", () => ({
  google: {
    calendar: () => ({
      events: {
        insert: mockInsert,
      },
    }),
  },
}));

jest.mock("../src/modules/integrations/google/googleClient.js", () => ({
  getGoogleOAuth2Client: jest.fn(() => ({})),
}));

jest.mock("../src/config/env.js", () => ({
  env: {
    GOOGLE_CLIENT_ID: "test-client-id",
    GOOGLE_CLIENT_SECRET: "test-secret",
    GOOGLE_REFRESH_TOKEN: "test-token",
    GOOGLE_CALENDAR_ID: "primary",
  },
}));

jest.mock("../src/config/logger.js", () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

import { createCalendarEvent } from "../src/modules/integrations/google/googleCalendar.service.js";

const baseParams = {
  title: "Test Event",
  attendeeName: "Jane",
  startIso: "2027-02-20T10:00:00.000Z",
  durationMinutes: 30,
  timezone: "Africa/Harare",
};

beforeEach(() => {
  mockInsert.mockReset();
  mockInsert.mockResolvedValue({
    data: { id: "google-ev-1", htmlLink: "https://calendar.google.com/event/1" },
  });
});

describe("createCalendarEvent", () => {
  it("calls calendar.events.insert with attendees and sendUpdates 'all' when attendeeEmail is provided", async () => {
    await createCalendarEvent({
      ...baseParams,
      attendeeEmail: "jane@example.com",
    });

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const [call] = mockInsert.mock.calls;
    expect(call[0]).toMatchObject({
      sendUpdates: "all",
      requestBody: {
        summary: baseParams.title,
        start: { dateTime: baseParams.startIso, timeZone: baseParams.timezone },
        attendees: [{ email: "jane@example.com", displayName: "Jane" }],
      },
    });
    expect(call[0].requestBody.attendees).toHaveLength(1);
    expect(call[0].requestBody.attendees![0]).toEqual({
      email: "jane@example.com",
      displayName: "Jane",
    });
  });

  it("calls calendar.events.insert without attendees and sendUpdates 'none' when attendeeEmail is missing", async () => {
    await createCalendarEvent(baseParams);

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const [call] = mockInsert.mock.calls;
    expect(call[0].sendUpdates).toBe("none");
    expect(call[0].requestBody.attendees).toBeUndefined();
    expect(call[0].requestBody.summary).toBe(baseParams.title);
  });

  it("calls calendar.events.insert without attendees and sendUpdates 'none' when attendeeEmail is empty string", async () => {
    await createCalendarEvent({
      ...baseParams,
      attendeeEmail: "",
    });

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const [call] = mockInsert.mock.calls;
    expect(call[0].sendUpdates).toBe("none");
    expect(call[0].requestBody.attendees).toBeUndefined();
  });
});
