import type { Session } from "~/lib/auth"

/**
 * Which transport invoked the procedure.
 *
 * - `rpc`: JSON-over-HTTP via `/api/rpc/*` (TanStack Query, browser clients)
 * - `rsc`: in-process call from a React Server Component (no HTTP)
 * - `mcp`: a tool call from an MCP client, via the public `/mcp` as a guest or the admin
 *   `/api/mcp` as the admin it acts as
 */
type Source = "rpc" | "rsc" | "mcp"

export type SessionUser = Session["user"]

/**
 * Initial context shape: what a transport may inject before middleware runs.
 *
 * `user` lets a transport pre-resolve a session. An unset `source` means
 * `"rpc"`; the base middleware normalizes it.
 */
export interface InitialContext {
  user?: SessionUser | null
  source?: Source
}
