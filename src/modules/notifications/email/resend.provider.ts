import { env } from "../../../config/env.js";
import { logger } from "../../../config/logger.js";
import type { EmailProvider, SendEmailParams, SendEmailResult } from "./email.types.js";

const RESEND_SANDBOX_FROM = "Voice Agent <onboarding@resend.dev>";

async function sendViaResend(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  const from =
    env.EMAIL_FROM.includes("yourdomain.com") ? RESEND_SANDBOX_FROM : env.EMAIL_FROM;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (params.idempotencyKey) headers["Idempotency-Key"] = params.idempotencyKey;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      text: params.text,
      html: params.html,
      headers: params.headers,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error({ status: res.status, body }, "Resend API error");
    throw new Error(`Resend API error: ${res.status} ${body}`);
  }

  const data = (await res.json()) as { id?: string };
  return { providerMessageId: data.id };
}

export const resendProvider: EmailProvider = {
  sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    return sendViaResend(params);
  },
};
