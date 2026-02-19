import { Router } from "express";
import * as controller from "./health.controller.js";

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     status: { type: string }
 *                     uptime: { type: number }
 *                     timestamp: { type: string, format: date-time }
 */
router.get("/", controller.getHealth);

export default router;
