import { redirect } from "next/navigation"
import { connection } from "next/server"
import { getServerSession } from "~/lib/auth"
import type { SessionUser } from "~/server/orpc/context"
import { can } from "~/server/orpc/permissions"
import type { Permission } from "~/server/orpc/roles"

/**
 * Authoritative auth check for Server Components, the non-bypassable counterpart
 * to the proxy's optimistic cookie redirect. Resolves the session and redirects
 * anonymous callers to the login page, returning a guaranteed non-null user.
 *
 * Use it at the top of any `/app` layout or page that requires a signed-in user.
 */
export async function requireUser(): Promise<SessionUser> {
  // Session validation compares the expiry against `new Date()`, which Next
  // rejects as an unstable value during prerendering. The guard reads the
  // cookie anyway, so the render is request-time by nature.
  await connection()

  const session = await getServerSession()

  if (!session?.user) {
    redirect("/auth/login")
  }

  return session.user
}

/**
 * Authoritative permission gate for an `/app` route segment. Requires a signed-in
 * user holding `permission`, redirecting anyone who lacks it back to the dashboard
 * index. Authorization is evaluated by the same `can()` used everywhere else, so
 * the route guard and the procedure/UI gates share a single source of truth.
 *
 * @example
 *   // app/app/users/layout.tsx
 *   export default async function ({ children }: LayoutProps<"/app/users">) {
 *     await requirePermission("users.read")
 *     return children
 *   }
 */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser()

  if (!can(user, permission)) {
    redirect("/app")
  }

  return user
}
