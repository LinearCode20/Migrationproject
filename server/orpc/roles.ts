import type { SessionUser } from "~/server/orpc/context"

/**
 * A permission identifies an action on an entity, e.g. `"tools.read"`.
 *
 * Permission strings are *requested* by procedures via `meta.permission`
 * and by `can(user, permission)`. They are not stored.
 */
export type Permission = string

/**
 * A grant is what a role *has*. Supported forms:
 *
 * - `"*"`                       every permission
 * - `"<entity>.*"`              every action on an entity
 * - `"<entity>.<action>"`       atomic grant
 *
 * Grants are role-scoped strings with no per-resource ownership check.
 */
export type Grant = string

/**
 * Built-in roles.
 *
 * Add new roles (e.g. `editor`, `moderator`) by adding entries here and
 * extending the `Role` union.
 */
export type Role = "admin" | "user" | "guest"

// Permissions available to everyone, signed in or not: public tool reads and
// search, and the newsletter and report forms.
const PUBLIC_GRANTS = ["tools.read", "search.read", "subscribe.create", "reports.create"] as const

// Permissions for any signed-in user, on top of the public ones: bookmarking,
// submitting/verifying their own tools, and the Stripe checkout flow, whose
// payer becomes the tool's owner. Roles are flat (no inheritance), so the public
// grants are spread in explicitly.
const USER_GRANTS = [
  ...PUBLIC_GRANTS,
  "tools.submit",
  "tools.verify",
  "products.checkout",
  "bookmarks.*",
] as const

export const ROLES: Record<Role, readonly Grant[]> = {
  // `*` grants every permission, including admin-only ones like user
  // administration and content moderation.
  admin: ["*"],

  user: USER_GRANTS,

  guest: PUBLIC_GRANTS,
}

/**
 * Resolve the effective role for a session user. Returns `"guest"` for
 * anonymous callers or users with an unknown role string.
 */
export function roleOf(user: SessionUser | null | undefined): Role {
  const candidate = user?.role
  if (candidate && candidate in ROLES) {
    return candidate as Role
  }
  return "guest"
}
