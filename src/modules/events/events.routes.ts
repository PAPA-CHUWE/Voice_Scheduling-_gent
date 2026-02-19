import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { authOptional } from "../../middlewares/authOptional.js";
import * as controller from "./events.controller.js";
import { CreateEventSchema, ListEventsQuerySchema } from "./events.schema.js";

const router = Router();

/**
 * @openapi
 * /events:
 *   post:
 *     tags: [Events]
 *     summary: Create a calendar event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [attendeeName, title, startIso]
 *             properties:
 *               sessionId: { type: string }
 *               attendeeName: { type: string, minLength: 2 }
 *               attendeeEmail: { type: string, format: email }
 *               title: { type: string }
 *               startIso: { type: string, format: date-time }
 *               durationMinutes: { type: number, minimum: 5, maximum: 480 }
 *               timezone: { type: string, description: "IANA timezone" }
 *               calendarId: { type: string }
 *               description: { type: string, maxLength: 2000 }
 *               reminderOffsetsMinutes: { type: array, items: { type: number } }
 *               remindersEnabled: { type: boolean }
 *             example:
 *               attendeeName: "Jane"
 *               attendeeEmail: "jane@example.com"
 *               title: "Demo"
 *               startIso: "2027-02-20T10:00:00.000Z"
 *               description: "Optional event description"
 *     responses:
 *       201:
 *         description: Event created. Returns notification status (confirmationEmail, reminders). Use x-idempotency-key header for idempotent creates.
 *       400:
 *         description: Validation error
 */
router.post("/", authOptional, validate(CreateEventSchema), controller.createEvent);

/**
 * @openapi
 * /events:
 *   get:
 *     tags: [Events]
 *     summary: List events
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: number }
 *       - in: query
 *         name: page
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: List of events
 */
router.get("/", authOptional, validate(ListEventsQuerySchema, "query"), controller.listEvents);

/**
 * @openapi
 * /events/{id}:
 *   get:
 *     tags: [Events]
 *     summary: Get event by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event
 *       404:
 *         description: Not found
 */
router.get("/:id", authOptional, controller.getEvent);

export default router;
