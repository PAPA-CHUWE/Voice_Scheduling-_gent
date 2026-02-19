import { google } from "googleapis";
import http from "http";
import "dotenv/config";

// Use GOOGLE_REDIRECT_URI from .env if set (must match a redirect URI in your Web client).
// Example: http://localhost:5000/oauth2callback
// If unset, defaults to http://localhost:3456/callback — add that exact URI in Google Console.
function getRedirectConfig(): { redirectUri: string; port: number; path: string } {
  const env = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (env) {
    const u = new URL(env);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("GOOGLE_REDIRECT_URI must be http or https");
    const port = u.port ? parseInt(u.port, 10) : (u.protocol === "https:" ? 443 : 80);
    return { redirectUri: env, port, path: u.pathname || "/" };
  }
  const port = 3456;
  return { redirectUri: `http://localhost:${port}/callback`, port, path: "/callback" };
}

const { redirectUri: REDIRECT_URI, port: CALLBACK_PORT, path: CALLBACK_PATH } = getRedirectConfig();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = ["https://www.googleapis.com/auth/calendar"];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: scopes,
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${CALLBACK_PORT}`);
  if (url.pathname !== CALLBACK_PATH || !url.searchParams.has("code")) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  const code = url.searchParams.get("code")!.trim();
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(
    "<!DOCTYPE html><html><body><p>Authorization successful. You can close this tab and return to the terminal.</p></body></html>"
  );

  server.close();

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("\nTokens received (access_token hidden):\n", {
      ...tokens,
      access_token: tokens.access_token ? "[REDACTED]" : undefined,
    });
    if (!tokens.refresh_token) {
      console.log("\n❌ No refresh token returned!");
      console.log("1. Go to https://myaccount.google.com/permissions and remove this app");
      console.log("2. Run this script again and authorize");
      console.log("3. Ensure OAuth consent screen is in Testing and your email is a Test User");
    } else {
      console.log("\n✅ YOUR REFRESH TOKEN (add to .env as GOOGLE_REFRESH_TOKEN):\n");
      console.log(tokens.refresh_token);
    }
  } catch (err) {
    console.error("\n❌ Token exchange failed:", err);
  }
  process.exit(0);
});

server.listen(CALLBACK_PORT, () => {
  console.log("\nRedirect URI this script is using (must match Google Console exactly):");
  console.log("  " + REDIRECT_URI);
  console.log("\nIf you get redirect_uri_mismatch:");
  console.log("  1. Open https://console.cloud.google.com/apis/credentials");
  console.log("  2. Edit your WEB client (same Client ID as in .env)");
  console.log("  3. Under 'Authorized redirect URIs' add the line above (no trailing slash)");
  console.log("  4. Save and run this script again.\n");
  console.log("Authorize this app by visiting:\n");
  console.log(authUrl);
  console.log("\nWaiting for callback...\n");
});
