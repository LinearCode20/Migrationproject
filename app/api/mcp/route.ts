import { createHash, timingSafeEqual } from "node:crypto"
import type { AuthInfo } from "@modelcontextprotocol/server"
import { isMcpEnabled } from "~/config/mcp"
import { env } from "~/env"
import { createStatelessMcpHandler, refuseMcpRequest } from "~/server/mcp/http"
import { createMcpServer } from "~/server/mcp/server"
import type { SessionUser } from "~/server/orpc/context"
import { findFirstAdmin } from "~/server/users/queries"

export const maxDuration = 60

// The user behind each request, keyed by its auth info. The SDK hands that object back to the
// server factory, for both protocol versions.
const users = new WeakMap<AuthInfo, SessionUser>()

const handler = createStatelessMcpHandler(({ authInfo }) => {
  const user = authInfo && users.get(authInfo)

  if (!user) {
    throw new Error("An MCP request reached the server without its user")
  }

  return createMcpServer({ audience: "admin", user })
})

function sha256(value: string) {
  return createHash("sha256").update(value).digest()
}

/**
 * Whether the request carries `MCP_SECRET` as its bearer token. Both sides are hashed first, so
 * the comparison takes the same time whatever the token's length or content.
 */
function hasMcpSecret(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? ""

  return !!env.MCP_SECRET && timingSafeEqual(sha256(token), sha256(env.MCP_SECRET))
}

/**
 * Serve one MCP request. The bearer token must be `MCP_SECRET`, and every call acts as the site's
 * first admin account, which also authors the posts an agent writes.
 */
export async function POST(request: Request) {
  if (!isMcpEnabled) {
    return refuseMcpRequest(404, "The MCP server is off. Set MCP_SECRET to turn it on.")
  }

  if (!hasMcpSecret(request)) {
    return refuseMcpRequest(
      401,
      "Send MCP_SECRET as a bearer token: `Authorization: Bearer <secret>`.",
      { "WWW-Authenticate": 'Bearer realm="mcp"' },
    )
  }

  const user = await findFirstAdmin()

  if (!user) {
    return refuseMcpRequest(
      403,
      "The MCP server acts as the site's first admin account, and there is none.",
    )
  }

  const authInfo: AuthInfo = { token: "", clientId: "mcp", scopes: [] }
  users.set(authInfo, user)

  return handler.fetch(request, { authInfo })
}
