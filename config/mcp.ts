import { HOUR_SECONDS } from "@dirstack/utils"
import { env } from "~/env"

/**
 * The admin MCP server is on only when its secret is set. Without it, `/api/mcp` answers 404.
 * The public server at `/mcp` is always on.
 */
export const isMcpEnabled = !!env.MCP_SECRET

export const mcpConfig = {
  // Whether the links the public server hands to AI assistants use tools' affiliate links. Off by
  // default, since neither the Claude nor the ChatGPT directory policy addresses affiliate links.
  // When on, each affiliate link comes with a "Paid link" disclosure.
  affiliateLinks: false,

  // Requests the public server at `/mcp` takes per hour. Assistants such as Claude and ChatGPT
  // call from shared address ranges, so the per-address limit is high and a site-wide limit caps
  // the total.
  publicRateLimits: {
    perAddress: { points: 1_000, duration: HOUR_SECONDS },
    total: { points: 20_000, duration: HOUR_SECONDS },
  },
}
