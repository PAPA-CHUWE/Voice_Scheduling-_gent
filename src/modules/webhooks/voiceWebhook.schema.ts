import { z } from "zod";

export const VoiceWebhookSchema = z.object({
  type: z.literal("tool_call").optional(),
  toolName: z.string().optional(),
  toolCall: z
    .object({
      function: z.object({
        name: z.string(),
        arguments: z.union([z.string(), z.record(z.unknown())]),
      }),
    })
    .optional(),
  message: z
    .object({
      toolCall: z
        .object({
          function: z.object({
            name: z.string(),
            arguments: z.union([z.string(), z.record(z.unknown())]),
          }),
        })
        .optional(),
      toolCalls: z
        .array(
          z.object({
            function: z.object({
              name: z.string(),
              arguments: z.union([z.string(), z.record(z.unknown())]),
            }),
          })
        )
        .optional(),
    })
    .optional(),
  arguments: z.record(z.unknown()).optional(),
  meta: z.record(z.unknown()).optional(),
}).passthrough();

export type VoiceWebhookPayload = z.infer<typeof VoiceWebhookSchema>;
