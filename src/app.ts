import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { setupSwagger } from "./config/swagger.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { apiRateLimiter } from "./middlewares/rateLimit.js";

import healthRoutes from "./modules/health/health.routes.js";
import sessionsRoutes from "./modules/sessions/sessions.routes.js";
import eventsRoutes from "./modules/events/events.routes.js";
import voiceWebhookRoutes from "./modules/webhooks/voiceWebhook.routes.js";
import oauthRoutes, { handleOAuthCallback } from "./modules/oauth/oauth.routes.js";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: env.CORS_ORIGINS === "*" ? true : env.CORS_ORIGINS.split(",").map((o) => o.trim()),
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(requestLogger);
app.use(apiRateLimiter);

setupSwagger(app);

app.use("/api/v1/oauth", oauthRoutes);
app.get("/oauth2callback", handleOAuthCallback);
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/sessions", sessionsRoutes);
app.use("/api/v1/events", eventsRoutes);
app.use("/api/v1/webhooks/voice", voiceWebhookRoutes);

app.use(errorHandler);

export default app;
