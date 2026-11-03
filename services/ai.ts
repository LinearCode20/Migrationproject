import { createGateway } from "ai"
import { siteConfig } from "~/config/site"
import { env } from "~/env"

/**
 * AI is on only when the AI Gateway key is set. Without it, the admin AI actions are
 * disabled and their procedures report the missing key.
 */
export const isAIEnabled = !!env.AI_GATEWAY_API_KEY

const gateway = createGateway({
  headers: {
    "http-referer": siteConfig.url,
    "x-title": siteConfig.name,
  },
})

export function getChatModel() {
  return gateway(env.AI_CHAT_MODEL)
}
export function getCompletionModel() {
  return gateway(env.AI_COMPLETION_MODEL)
}
