# Voice Scheduling Agent - Backend

Production-grade Node.js + TypeScript backend for a voice scheduling agent. Creates Google Calendar events, manages sessions, sends confirmation and reminder emails (Resend), schedules reminders via BullMQ + Redis, and handles voice platform webhooks (Vapi/Retell/OpenAI Realtime).

## Quick Start

### Local with Docker (MongoDB + Redis + API + Worker)

```bash
cd server
cp .env.example .env
# Set RESEND_API_KEY, Google OAuth, etc.
docker compose up --build
```

- API: http://localhost:5000  
- Swagger: http://localhost:5000/docs  
- Reminder worker runs as a separate container.

### Local without Docker

```bash
cd server
npm install
cp .env.example .env
# Set MONGODB_URI, REDIS_URL, RESEND_API_KEY, Google OAuth
npm run dev
# In another terminal (for reminders):
npm run worker
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| NODE_ENV | No | `development` \| `test` \| `production` |
| PORT | No | Server port (default: 5000) |
| MONGODB_URI | No* | MongoDB connection (default: mongodb://localhost:27017/voice_scheduler) |
| REDIS_URL | No | Redis URL for BullMQ (default: redis://localhost:6379) |
| API_KEY | No | Optional x-api-key for non-webhook routes |
| WEBHOOK_SECRET | No | Optional x-webhook-secret for POST /api/v1/webhooks/voice |
| GOOGLE_CLIENT_ID | Yes** | Google OAuth client ID |
| GOOGLE_CLIENT_SECRET | Yes** | Google OAuth client secret |
| GOOGLE_REFRESH_TOKEN | Yes** | Google OAuth refresh token |
| GOOGLE_CALENDAR_ID | No | Calendar ID (default: primary) |
| DEFAULT_TIMEZONE | No | Default IANA timezone (default: Africa/Harare) |
| CORS_ORIGINS | No | Comma-separated origins or * |
| EMAIL_ENABLED | No | Set to `false` to disable email (default: true) |
| EMAIL_FROM | No | From address (default: Voice Agent &lt;no-reply@yourdomain.com&gt;) |
| RESEND_API_KEY | No*** | Resend API key for sending email |
| REMINDERS_ENABLED | No | Set to `false` to disable reminder scheduling (default: true) |

\* Required for persistence; default works for local dev.  
\** Required for creating Google Calendar events.  
\*** Required for confirmation and reminder emails when EMAIL_ENABLED is true.

## Email (Resend)

- **Confirmation email**: Sent when an event is created and the attendee has an email (from `attendeeEmail` or session/user).
- **Reminder emails**: Sent by the worker at configured offsets (default 60 and 10 minutes before the event) when REMINDERS_ENABLED and email are available.
- Set `RESEND_API_KEY` in `.env`. For local testing you can use [Resend](https://resend.com) or a similar provider.
- If no email is provided, confirmation and reminders are **skipped**; the event is still created.

## Reminders (BullMQ + Redis)

- Reminders are **scheduled** when an event is created (if REMINDERS_ENABLED and attendee email exist).
- A separate **worker** process runs the queue: `npm run worker`.
- Default offsets: 60 and 10 minutes before the event start.
- Override per request with `reminderOffsetsMinutes` and `remindersEnabled` (events API or webhook `reminder_offsets_minutes` / `reminders_enabled`).
- Redis must be running for scheduling and for the worker.

## Running the worker

```bash
# With Redis and MongoDB available:
npm run worker
```

Keep this process running (or run the `worker` service in docker-compose) so reminder jobs are processed.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/health | Health check |
| POST | /api/v1/sessions | Create session (optional: userName, email, timezone, meetingTitle, proposedStartIso) |
| GET | /api/v1/sessions | List sessions |
| GET | /api/v1/sessions/:id | Get session |
| PATCH | /api/v1/sessions/:id | Update session (optional: userName, email, meetingTitle, proposedStartIso, durationMinutes, status) |
| POST | /api/v1/events | Create event (optional: description, attendeeEmail, reminderOffsetsMinutes, remindersEnabled; header x-idempotency-key) |
| GET | /api/v1/events | List events |
| GET | /api/v1/events/:id | Get event |
| POST | /api/v1/webhooks/voice | Voice tool-call webhook (snake_case: attendee_email, description, reminders_enabled, reminder_offsets_minutes) |

## Create event response

Responses include notification status:

```json
{
  "success": true,
  "data": {
    "eventId": "...",
    "provider": "google",
    "googleEventId": "...",
    "htmlLink": "...",
    "startIso": "2027-02-20T10:00:00.000Z",
    "endIso": "2027-02-20T10:30:00.000Z",
    "timezone": "Africa/Harare",
    "calendarId": "primary",
    "notification": {
      "confirmationEmail": "sent",
      "reminders": "scheduled"
    }
  }
}
```

When no email is provided, `confirmationEmail` and `reminders` are `"skipped"` and the webhook response may include `"message": "Email skipped because no email provided."`.

## Test with cURL

**Create event (no email → notifications skipped):**

```bash
curl -X POST http://localhost:5000/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "attendeeName": "Jane",
    "title": "Demo",
    "startIso": "2027-02-20T14:00:00.000Z",
    "durationMinutes": 30
  }'
```

**Create event with email and description:**

```bash
curl -X POST http://localhost:5000/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "attendeeName": "Jane",
    "attendeeEmail": "jane@example.com",
    "title": "Demo",
    "description": "Optional description",
    "startIso": "2027-02-20T14:00:00.000Z",
    "durationMinutes": 30
  }'
```

**Webhook (voice agent):**

```bash
curl -X POST http://localhost:5000/api/v1/webhooks/voice \
  -H "Content-Type: application/json" \
  -d '{
    "type": "tool_call",
    "toolName": "create_calendar_event",
    "arguments": {
      "attendee_name": "Tinashe",
      "attendee_email": "tinashe@example.com",
      "title": "Demo Call",
      "start_iso": "2027-02-20T10:00:00.000Z",
      "duration_minutes": 30,
      "timezone": "Africa/Harare",
      "description": "Optional",
      "reminders_enabled": true
    }
  }'
```

## Swagger

Open http://localhost:5000/docs for full request/response schemas (User, Event, NotificationLog, notification status, env flags).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start API with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled server |
| `npm run worker` | Run reminder worker (BullMQ) |
| `npm test` | Run tests |
| `npm run token` | Generate Google refresh token (Resend OAuth flow) |

## Tests

Unit/integration tests mock Google Calendar, events service, Session, and AuditLog where needed. No live MongoDB/Redis required for the current test suite.

```bash
npm test
```

## Schema / migrations

- New models: **User**, **NotificationLog**. **Session** and **Event** have new optional fields (userId, email, description, notificationStatus, reminderConfig, etc.).
- Existing documents remain valid; new fields are optional with defaults. No backfill script is required for basic operation.
