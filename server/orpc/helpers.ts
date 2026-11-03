import { ORPCError } from "@orpc/server"

/**
 * Assert a database lookup actually returned a record.
 *
 * Use in handlers that fetch a resource by id/slug and need to short-circuit
 * with a 404 if it is missing.
 *
 * @example
 *   const tool = ensureFound(await findToolById(input.id), "Tool")
 */
export function ensureFound<T>(value: T | null | undefined, label = "Resource"): T {
  if (value === null || value === undefined) {
    throw new ORPCError("NOT_FOUND", { message: `${label} not found` })
  }
  return value
}
