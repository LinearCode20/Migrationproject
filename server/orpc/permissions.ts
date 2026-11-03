import type { SessionUser } from "~/server/orpc/context"
import { ROLES, type Grant, type Permission, roleOf } from "~/server/orpc/roles"

const WILDCARD_SUFFIX = ".*"

/**
 * Does a grant cover the requested permission?
 *
 * Exported so the matching logic can be unit-tested in isolation.
 */
export function matchesPattern(grant: Grant, permission: Permission): boolean {
  if (grant === "*") {
    return true
  }

  if (grant === permission) {
    return true
  }

  if (grant.endsWith(WILDCARD_SUFFIX)) {
    const prefix = grant.slice(0, -WILDCARD_SUFFIX.length)
    return permission.startsWith(`${prefix}.`)
  }

  return false
}

/**
 * Can a user perform a permission?
 *
 * Returns true when any of the user's role grants matches. Used by the
 * procedure pre-handler gate and by UI menu/sidebar/button visibility.
 *
 * Authorization is role-based only; there is no per-resource ownership check.
 */
export function can(user: SessionUser | null | undefined, permission: Permission): boolean {
  return ROLES[roleOf(user)].some(grant => matchesPattern(grant, permission))
}
