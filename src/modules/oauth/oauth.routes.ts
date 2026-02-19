import { Router, type Request, type Response } from "express";
import { google } from "googleapis";
import { env } from "../../config/env.js";

const router = Router();
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

/**
 * Redirect to Google consent screen.
 * After user authorizes, Google redirects to GOOGLE_REDIRECT_URI (e.g. http://localhost:3001/oauth2callback) with ?code=...
 */
router.get("/google", (_req: Request, res: Response) => {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  res.redirect(url);
});

export async function handleOAuthCallback(req: Request, res: Response): Promise<void> {
  const { code } = req.query;
  if (!code || typeof code !== "string") {
    res.status(400).send(`
      <h1>Missing code</h1>
      <p>No authorization code in URL. Start from <a href="/api/v1/oauth/google">/api/v1/oauth/google</a>.</p>
    `);
    return;
  }

  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      res.send(`
        <h1>No refresh token</h1>
        <p>Google did not return a refresh token. Revoke app access and try again:</p>
        <p><a href="https://myaccount.google.com/permissions" target="_blank">Revoke access</a></p>
        <p>Then <a href="/api/v1/oauth/google">authorize again</a>.</p>
      `);
      return;
    }

    res.send(`
      <h1>Refresh token</h1>
      <p>Add this to your <code>.env</code> as <code>GOOGLE_REFRESH_TOKEN</code>, then restart the server.</p>
      <pre style="background:#f4f4f4;padding:1rem;overflow:auto;word-break:break-all;">${refreshToken}</pre>
      <p><a href="/docs">Back to Swagger</a></p>
    `);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).send(`
      <h1>Token exchange failed</h1>
      <pre>${message}</pre>
      <p>Ensure GOOGLE_REDIRECT_URI in .env is exactly: ${env.GOOGLE_REDIRECT_URI}</p>
      <p><a href="/api/v1/oauth/google">Try again</a></p>
    `);
  }
}

export default router;
