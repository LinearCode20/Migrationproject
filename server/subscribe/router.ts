import { DAY_SECONDS, tryCatch } from "@dirstack/utils"
import { ORPCError } from "@orpc/server"
import { publicProcedure } from "~/server/orpc/procedure"
import { newsletterSchema } from "~/server/subscribe/schema"
import { createResendContact } from "~/services/resend"

export const subscribe = {
  subscribe: publicProcedure
    .meta({
      permission: "subscribe.create",
      rateLimit: { points: 3, duration: DAY_SECONDS },
    })
    .input(newsletterSchema)
    .handler(async ({ input: { email } }) => {
      const { error } = await tryCatch(createResendContact({ email }))

      if (error) {
        console.error("Failed to create resend contact:", error)
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to subscribe. Please try again later.",
        })
      }

      return { success: true }
    }),
}
