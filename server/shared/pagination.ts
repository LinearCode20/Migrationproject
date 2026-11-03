import { endOfDay, startOfDay } from "date-fns"
import { type SortItem, withIdTiebreak } from "~/lib/parsers"

/**
 * Shared building blocks for the list queries: the admin tables (`findTools`,
 * `findUsers`, …) and the public catalog searches alike. They all paginate,
 * sort, and filter by a `createdAt` window the same way; these helpers hold that
 * shared shape so each query only declares its entity-specific filters.
 */

/**
 * Translate a data-table sort state into a Prisma `orderBy` array.
 */
export function toOrderBy(sort: SortItem[]) {
  return withIdTiebreak(sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const))
}

/**
 * A `createdAt` range filter from the optional `from`/`to` list params, or
 * `undefined` when neither bound is set (so it drops out of the `AND` list).
 */
export function createdAtRange(from?: string, to?: string) {
  const gte = from ? startOfDay(new Date(from)) : undefined
  const lte = to ? endOfDay(new Date(to)) : undefined

  if (!gte && !lte) {
    return
  }

  return { createdAt: { gte, lte } }
}
