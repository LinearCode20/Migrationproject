import { tryCatch } from "@dirstack/utils"
import { ORPCError } from "@orpc/server"
import { mcpConfig } from "~/config/mcp"
import { createStatelessMcpHandler, refuseMcpRequest } from "~/server/mcp/http"
import { createMcpServer } from "~/server/mcp/server"
import { consumeRateLimit } from "~/server/orpc/rate-limit"

export const maxDuration = 30

// The public server: read-only tools for anyone, with no sign-in, such as an assistant that
// recommends tools from the directory.
const handler = createStatelessMcpHandler(() => createMcpServer({ audience: "public", user: null }))

/**
 * Count the request against the per-address and the site-wide limits.
 */
async function consumePublicRateLimits() {
  const { perAddress, total } = mcpConfig.publicRateLimits

  await consumeRateLimit(perAddress, null, "mcp:public")
  await consumeRateLimit(total, "all", "mcp:public:total")
}

/**
 * Serve one request to the public MCP server, once it fits the rate limits.
 */
export async function POST(request: Request) {
  const { error } = await tryCatch(consumePublicRateLimits())

  if (error instanceof ORPCError) {
    const retryAfter = String(error.data?.retryAfterSeconds ?? 60)

    return refuseMcpRequest(429, error.message, { "Retry-After": retryAfter })
  }

  return handler.fetch(request)
}
