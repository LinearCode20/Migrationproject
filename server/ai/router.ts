import { ORPCError } from "@orpc/server"
import { generateText } from "ai"
import { z } from "zod"
import { AI_REQUEST_TIMEOUT_MS, generateContent, generateDescription } from "~/lib/ai"
import { scrapeWebsiteData } from "~/lib/scraper"
import {
  aiCompletionSchema,
  aiContentSchema,
  aiDescriptionSchema,
  contentSchema,
  descriptionSchema,
} from "~/server/ai/schema"
import { authedProcedure } from "~/server/orpc/procedure"
import { getCompletionModel, isAIEnabled } from "~/services/ai"

const adminAI = authedProcedure.meta({ permission: "ai.use" }).use(async ({ next }) => {
  if (!isAIEnabled) {
    throw new ORPCError("PRECONDITION_FAILED", {
      message: "AI features are not configured. Set AI_GATEWAY_API_KEY.",
    })
  }
  return next()
})

export const ai = {
  content: adminAI
    .input(aiContentSchema)
    .output(contentSchema)
    .handler(async ({ input: { url, instructions, skipCache }, signal }) => {
      // The oRPC layer masks plain thrown Errors to a generic message; rethrow as an
      // ORPCError so a clear failure reaches the admin toast (details are logged
      // server-side by the scraper).
      const data = await scrapeWebsiteData(url, { skipCache }).catch(() => {
        throw new ORPCError("BAD_GATEWAY", {
          message: "Couldn't fetch the website's content. Please check the URL and try again.",
        })
      })

      const result = await generateContent(data, { signal, instructions })

      if (!result) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Content generation failed" })
      }

      return result
    }),

  description: adminAI
    .input(aiDescriptionSchema)
    .output(descriptionSchema)
    .handler(async ({ input: { prompt, instructions }, signal }) => {
      const result = await generateDescription(prompt, { signal, instructions })

      if (!result) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Description generation failed" })
      }

      return result
    }),

  completion: adminAI
    .input(aiCompletionSchema)
    .output(z.object({ text: z.string() }))
    .handler(async ({ input: { prompt }, signal }) => {
      const { text } = await generateText({
        model: getCompletionModel(),
        prompt,
        abortSignal: signal,
        maxRetries: 0,
        timeout: AI_REQUEST_TIMEOUT_MS,
      })

      return { text }
    }),
}
