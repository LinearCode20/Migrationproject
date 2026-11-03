import { HOUR_SECONDS } from "@dirstack/utils"
import { ORPCError, os } from "@orpc/server"
import { getServerSession } from "~/lib/auth"
import type { McpToolMeta } from "~/server/mcp/registry"
import type { InitialContext } from "~/server/orpc/context"
import { can } from "~/server/orpc/permissions"
import { consumeRateLimit, type RateLimitConfig } from "~/server/orpc/rate-limit"
import type { Permission, Role } from "~/server/orpc/roles"

export interface ProcedureMeta {
  permission?: Permission
  rateLimit?: RateLimitConfig

  /**
   * Exposes the procedure as an MCP tool: on the public server at `/mcp` when a guest may call it,
   * and on the admin server at `/api/mcp` otherwise.
   */
  mcp?: McpToolMeta
}

/**
 * Roles that bypass rate limiting entirely. Edit this list (and only this
 * list) if you want moderators or another role to skip limits.
 */
const RATE_LIMIT_BYPASS_ROLES: readonly Role[] = ["admin"]

interface ProcedureWithMeta {
  "~orpc": { meta: unknown }
}

/**
 * Read a procedure's merged meta. oRPC types it loosely on the middleware side.
 */
function getMeta(procedure: ProcedureWithMeta) {
  return procedure["~orpc"].meta as ProcedureMeta
}

const base = os.$context<InitialContext>().$meta<ProcedureMeta>({
  rateLimit: { points: 600, duration: HOUR_SECONDS },
})

const withBaseContext = base.middleware(async ({ next, context }) =>
  next({
    context: {
      source: context.source ?? ("rpc" as const),
    },
  }),
)

const withSession = base.middleware(async ({ next, context }) => {
  const user = context.user ?? (await getServerSession())?.user ?? null
  return next({ context: { user } })
})

const withRateLimitGate = base.middleware(async ({ next, context, procedure, path }) => {
  // RSC calls are in-process: the originating HTTP request was already
  // counted, so counting again would double-charge. MCP calls are limited
  // by their server instead: the public `/mcp` route counts its requests,
  // and the admin `/api/mcp` sits behind `MCP_SECRET`.
  if (context.source === "rsc" || context.source === "mcp") {
    return next()
  }

  const role = context.user?.role
  if (role && RATE_LIMIT_BYPASS_ROLES.includes(role as Role)) {
    return next()
  }

  const config = getMeta(procedure).rateLimit
  if (!config || config === "none") {
    return next()
  }

  // Scope the bucket to this procedure so sibling procedures sharing the same
  // `{ points, duration }` numbers (e.g. tool submit and newsletter subscribe,
  // both 3/day) keep independent quotas.
  await consumeRateLimit(config, context.user?.id, path.join("/"))
  return next()
})

const withPermissionGate = base.middleware(async ({ next, context, procedure }) => {
  const permission = getMeta(procedure).permission
  if (!permission) {
    return next()
  }

  if (!can(context.user ?? null, permission)) {
    if (!context.user) {
      throw new ORPCError("UNAUTHORIZED", { message: "Authentication required" })
    }
    throw new ORPCError("FORBIDDEN", { message: "You don't have permission to do this." })
  }

  return next()
})

/**
 * Two builders cover every procedure:
 *
 * - `publicProcedure`: anonymous-reachable procedures (a public permission, or
 *   none). `context.user` may be `null`.
 * - `authedProcedure`: everything else. Asserts a signed-in user and narrows
 *   `context.user` to non-null for the handler.
 *
 * Both share the same pipeline (top → bottom):
 *   1. base context: normalizes `source`
 *   2. session:      resolves `user` from cookie unless pre-injected
 *   3. rate limit:   reads `meta.rateLimit`; skips RSC, MCP and bypass roles
 *   4. permission:   reads `meta.permission`; calls `can(user, permission)`
 * `authedProcedure` adds a 5th step asserting `context.user`.
 *
 * Authorization is governed entirely by `meta.permission`; the `can()` check in
 * step 4 is the single source of truth for who may call a procedure. A non-public
 * permission already rejects anonymous callers there, so `authedProcedure` adds no
 * new authorization; it only surfaces the non-null `user` that permission already
 * implies, and acts as the deny-by-default backstop for a procedure that omits a
 * public permission. Reach for `publicProcedure` only to deliberately admit
 * anonymous callers.
 *
 * Compose router-level defaults by deriving a builder at the top of an entity
 * router and chaining further `.meta()` calls on each procedure. Meta is
 * shallow-merged (see `@orpc/contract` `mergeMeta`).
 *
 * @example
 *   // server/tools/router.ts
 *   const publicReads = publicProcedure.meta({ permission: "tools.read" })
 *
 *   export const tools = {
 *     // Public read: anonymous allowed, `context.user` may be null.
 *     filterOptions: publicReads.handler(async () => findPublicCategories()),
 *
 *     // Authenticated: `context.user` is guaranteed non-null.
 *     submit: authedProcedure
 *       .meta({ permission: "tools.submit", rateLimit: { points: 3, duration: DAY_SECONDS } })
 *       .input(toolSubmitSchema)
 *       .handler(async ({ input, context: { user } }) => {
 *         return createTool({ data: { ...input, ownerId: user.id } })
 *       }),
 *   }
 */
export const publicProcedure = base
  .use(withBaseContext)
  .use(withSession)
  .use(withRateLimitGate)
  .use(withPermissionGate)

export const authedProcedure = publicProcedure.use(async ({ next, context }) => {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED", { message: "Authentication required" })
  }

  return next({ context: { user: context.user } })
})
