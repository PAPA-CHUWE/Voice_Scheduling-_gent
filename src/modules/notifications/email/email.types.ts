export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
  headers?: Record<string, string>;
  idempotencyKey?: string;
}

export interface SendEmailResult {
  providerMessageId?: string;
}

export interface EmailProvider {
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}
