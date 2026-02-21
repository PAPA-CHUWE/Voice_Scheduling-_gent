import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { authOptional } from "../../middlewares/authOptional.js";
import * as controller from "./sessions.controller.js";
import {
  CreateSessionSchema,
  UpdateSessionSchema,
  ListSessionsQuerySchema,
} from "./sessions.schema.js";

const router = Router();

/**
 * @openapi
 * /sessions:
 *   post:
 *     tags: [Sessions]
 *     summary: Create a session
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               channel: { type: string, enum: [web, voice, api] }
 *               userName: { type: string }
 *               email: { type: string }
 *               timezone: { type: string }
 *               durationMinutes: { type: number }
 *               meetingTitle: { type: string }
 *               proposedStartIso: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Session created
 */
router.post("/", authOptional, validate(CreateSessionSchema), controller.createSession);

/**
 * @openapi
 * /sessions:
 *   get:
 *     tags: [Sessions]
 *     summary: List sessions
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by userName, email, or meetingTitle (case-insensitive)
 *       - in: query
 *         name: limit
 *         schema: { type: number }
 *       - in: query
 *         name: page
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get("/", authOptional, validate(ListSessionsQuerySchema, "query"), controller.listSessions);

/**
 * @openapi
 * /sessions/{id}:
 *   get:
 *     tags: [Sessions]
 *     summary: Get session by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session
 *       404:
 *         description: Not found
 */
router.get("/:id", authOptional, controller.getSession);

/**
 * @openapi
 * /sessions/{id}:
 *   delete:
 *     tags: [Sessions]
 *     summary: Delete session by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Session deleted
 *       404:
 *         description: Not found
 */
router.delete("/:id", authOptional, controller.deleteSession);

/**
 * @openapi
 * /sessions/{id}:
 *   patch:
 *     tags: [Sessions]
 *     summary: Update session
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName: { type: string }
 *               meetingTitle: { type: string }
 *               proposedStartIso: { type: string, format: date-time }
 *               durationMinutes: { type: number }
 *               status: { type: string, enum: [initiated, collecting, confirmed, booked, failed] }
 *     responses:
 *       200:
 *         description: Session updated
 */
router.patch("/:id", authOptional, validate(UpdateSessionSchema), controller.updateSession);

export default router;
