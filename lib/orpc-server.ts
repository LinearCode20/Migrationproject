import { tryCatch } from "@dirstack/utils"
import { createRouterClient, ORPCError } from "@orpc/server"
import { notFound } from "next/navigation"
import { getServerSession } from "~/lib/auth"
import { appRouter } from "~/server/orpc/router"

/**
 * In-process client for invoking oRPC procedures from React Server
 * Components. Resolves the current session and tags the call with
 * `source: "rsc"` so middleware skips rate limiting (the originating
 * HTTP request was already counted) while still enforcing permissions
 * exactly like the `/api/rpc` transport.
 *
 * @example
 *   // app/app/users/[id]/page.tsx
 *   import { orNotFound, rsc } from "~/lib/orpc-server"
 *
 *   export default async function UserPage({ params }) {
 *     const { id } = await params
 *     const api = await rsc()
 *     const user = await orNotFound(api.users.byId({ id }))
 *     return <UserForm user={user} />
 *   }
 */
export async function rsc() {
  const session = await getServerSession()

  return createRouterClient(appRouter, {
    context: {
      user: session?.user ?? null,
      source: "rsc" as const,
    },
  })
}

/**
 * Await an `rsc()` read and turn a `NOT_FOUND` procedure error into Next's
 * `notFound()`. Other errors (including `FORBIDDEN`) propagate unchanged.
 *
 * Lets a Server Component fetch a record through the permission-gated client
 * and render the 404 page when it is missing, without an explicit null check.
 *
 * @example
 *   const user = await orNotFound(api.users.byId({ id }))
 */
export async function orNotFound<T>(promise: Promise<T>): Promise<T> {
  const { data, error } = await tryCatch(promise)

  if (error instanceof ORPCError && error.code === "NOT_FOUND") {
    notFound()
  }

  if (error) {
    throw error
  }

  return data
}
