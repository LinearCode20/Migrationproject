import { parseAsInteger, parseAsString } from "nuqs/server"
import { z } from "zod"
import { getSortingStateParser, sortItemSchema, type SortItem } from "~/lib/parsers"
import type { ExtendedColumnSort, ExtendedSortingState } from "~/types"

/**
 * Shared list-endpoint shape for the admin tables: page, perPage, sort and a
 * `createdAt` window, expressed once as a Zod input schema (validated by the
 * procedure) and once as nuqs parsers (read from the URL by the table).
 */

function parseSortValue(value: string | SortItem[]) {
  if (typeof value !== "string") {
    return value
  }

  if (!value) {
    return []
  }

  return value.split(",").map(part => {
    const [id, dir] = part.split(":")
    return { id: id!.trim(), desc: dir?.trim() === "desc" }
  })
}

function createSortSchema(defaultSort: SortItem, allowedFields: readonly string[]) {
  const allowed = new Set<string>(allowedFields)

  return z
    .union([z.string(), z.array(sortItemSchema)])
    .default([defaultSort])
    .transform(parseSortValue)
    .superRefine((items, context) => {
      for (const [index, item] of items.entries()) {
        if (!item.id) {
          context.addIssue({
            code: "custom",
            message: "Sort field is required",
            path: [index, "id"],
          })
          continue
        }

        if (!allowed.has(item.id)) {
          context.addIssue({
            code: "custom",
            message: `Invalid sort field: ${item.id}`,
            path: [index, "id"],
          })
        }
      }
    })
}

/**
 * Optional date filter for list endpoints. Empty string means "no filter".
 */
const listDateParam = z
  .string()
  .default("")
  .superRefine((value, context) => {
    if (!value) {
      return
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      context.addIssue({
        code: "custom",
        message: "Invalid date",
      })
    }
  })

/**
 * Accepts repeated, bracket, and scalar array query params and coerces a
 * single scalar to a one-element array.
 */
export function arrayable<T extends z.ZodTypeAny>(schema: T) {
  return z
    .array(schema)
    .or(schema)
    .transform(value => (Array.isArray(value) ? value : [value]))
}

/**
 * Zod input for an admin list procedure. Entities add their own filters with
 * `.extend({ ... })`.
 */
export function createListSchema<const T extends readonly string[]>(
  sortFields: T,
  defaultSort: SortItem & { id: T[number] },
  perPage = 25,
) {
  return z.object({
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(perPage),
    sort: createSortSchema(defaultSort, sortFields),
    from: listDateParam,
    to: listDateParam,
  })
}

/**
 * The nuqs parsers matching {@link createListSchema}. Entities spread the result
 * and add parsers for their own filters.
 */
export function createListParams<TData>(defaultSort: ExtendedColumnSort<TData>, perPage = 25) {
  return {
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(perPage),
    sort: getSortingStateParser<TData>().withDefault([defaultSort] as ExtendedSortingState<TData>),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
  }
}
