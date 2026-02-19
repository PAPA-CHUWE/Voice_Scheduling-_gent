import { Router } from "express";
import { requireWebhookSecret } from "../../middlewares/authOptional.js";
import * as controller from "./voiceWebhook.controller.js";

const router = Router();

/**
 * @openapi
 * /webhooks/voice:
 *   post:
 *     tags: [Webhooks]
 *     summary: Voice agent tool-call webhook
 *     description: Accepts tool_call payloads from Vapi/Retell/OpenAI Realtime
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string, example: tool_call }
 *               toolName: { type: string, example: create_calendar_event }
 *               arguments:
 *                 type: object
 *                 properties:
 *                   attendee_name: { type: string }
 *                   attendee_email: { type: string }
 *                   title: { type: string }
 *                   start_iso: { type: string, format: date-time }
 *                   duration_minutes: { type: number }
 *                   timezone: { type: string }
 *                   description: { type: string }
 *                   reminders_enabled: { type: boolean }
 *                   reminder_offsets_minutes: { type: array, items: { type: number } }
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Validation error
 *       502:
 *         description: Calendar create failed
 */
router.post("/", requireWebhookSecret, controller.handleVoiceWebhook);

export default router;
