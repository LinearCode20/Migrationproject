import { createMcpHandler, type McpServerFactory } from "@modelcontextprotocol/server"

// JSON-RPC leaves -32000 to -32099 to the server. Every refusal before a request reaches an MCP
// server uses this one code, and the HTTP status says why.
const REFUSED_CODE = -32_001

/**
 * A stateless MCP handler: each request gets a server of its own from the factory, for the
 * 2026-07-28 protocol and for a client that still speaks the 2025 one.
 */
export function createStatelessMcpHandler(factory: McpServerFactory) {
  return createMcpHandler(factory, {
    legacy: "stateless",
    onerror: error => console.error("[MCP Error]", error),
  })
}

/**
 * A refusal in the JSON-RPC shape an MCP client reads.
 */
export function refuseMcpRequest(status: number, message: string, headers?: HeadersInit) {
  return Response.json(
    { jsonrpc: "2.0", error: { code: REFUSED_CODE, message }, id: null },
    { status, headers },
  )
}
