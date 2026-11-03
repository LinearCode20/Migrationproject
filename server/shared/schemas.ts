import { z } from "zod"

/**
 * Cross-entity input schemas used by multiple routers.
 *
 * Anything entity-specific lives in `server/<entity>/schema.ts`; this file is
 * for primitives reused across all entities (id-based mutations, dropdown
 * outputs, etc.).
 */

export const idSchema = z.object({
  id: z.string(),
})

export const idsSchema = z.object({
  ids: z.array(z.string()).min(1),
})

const relationSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const relationListSchema = z.array(relationSchema)
