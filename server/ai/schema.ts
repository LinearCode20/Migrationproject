// Input and output schemas for the AI router procedures.
import { z } from "zod"

export const aiContentSchema = z.object({
  url: z.url(),
  instructions: z.string().max(1000).optional(),
  skipCache: z.boolean().default(false),
})

export const aiDescriptionSchema = z.object({
  prompt: z.string().min(1),
  instructions: z.string().max(1000).optional(),
})

export const aiCompletionSchema = z.object({
  prompt: z.string().min(1),
})

/**
 * AI content generator output. Used by the AI router and consumed by
 * `~/lib/ai` via the structured output validator.
 */
export const contentSchema = z.object({
  tagline: z
    .string()
    .describe(
      "Short line capturing what the tool does and why someone would use it. Max 60 characters. Don't include the tool name. No hype words.",
    ),
  description: z
    .string()
    .describe(
      "One-line meta description. Max 160 characters. Specific about what the tool is, not how great it is. No hype words. Active voice. Don't include the tool name.",
    ),
  content: z
    .string()
    .describe(
      "Longer description, around 1500 characters (max 2000). Cover what the tool does, who it's for, its key capabilities, and what makes it stand out. Concrete over abstract.",
    ),
})

export const descriptionSchema = contentSchema.pick({ description: true })
