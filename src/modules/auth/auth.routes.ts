import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import * as controller from "./auth.controller.js";
import { LoginBodySchema } from "./auth.schema.js";

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email (find or create user, returns JWT)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Token and user info
 *       503:
 *         description: Login not configured (JWT_SECRET missing)
 */
router.post("/login", validate(LoginBodySchema), controller.login);

export default router;
