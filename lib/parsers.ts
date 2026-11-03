import { clamp } from "@dirstack/utils"
import type { Row } from "@tanstack/react-table"
import type { inferParserType, ParserMap } from "nuqs"
import { createParser, parseAsInteger } from "nuqs/server"
import { z } from "zod"
import type { ExtendedSortingState } from "~/types"

interface SortDefinition<TOrderBy> {
  label: string
  orderBy: TOrderBy | TOrderBy[]
}

type SortMap<TOrderBy> = Record<string, SortDefinition<TOrderBy>>

/**
 * Append a stable `id` tiebreaker to a Prisma `orderBy`, so rows with equal
 * sort values keep a deterministic order across pages.
 */
export function withIdTiebreak<TOrderBy extends { id?: unknown }>(orderBy: TOrderBy | TOrderBy[]) {
  return [...(Array.isArray(orderBy) ? orderBy : [orderBy]), { id: "asc" } as TOrderBy]
}

/**
 * Creates a sort parser with a typed map of sort options. Keys outside the map
 * collapse to the default sort, keeping the URL (and CDN cache) space bounded.
 * A resolved sort always ends with an `id` tiebreaker (see `withIdTiebreak`).
 */
export function createSortParser<TOrderBy extends { id?: unknown }>(sortMap: SortMap<TOrderBy>) {
  return {
    parser: createParser({
      parse: value => (Object.hasOwn(sortMap, value) ? value : null),
      serialize: (value: string) => value,
    }).withDefault(""),
    resolve: (key: string) => {
      const orderBy = sortMap[key]?.orderBy
      return orderBy ? withIdTiebreak(orderBy) : undefined
    },
    options: sortMap,
  }
}

/**
 * Deepest page reachable from a URL. Past this the offset stops being a real
 * request and starts being an unbounded supply of distinct cache keys, and a
 * large enough `skip` overflows the i64 the query engine accepts.
 */
const MAX_PAGE = 10_000

/**
 * Page number, clamped to a real range. `parseAsInteger` accepts `0`, negatives
 * (a negative `skip`) and arbitrarily large values alike.
 */
export const parseAsPage = createParser({
  parse: value => {
    const page = parseAsInteger.parse(value)
    return page === null ? null : clamp(page, 1, MAX_PAGE)
  },
  serialize: parseAsInteger.serialize,
}).withDefault(1)

/** Longest free-text query accepted; bounds both the cache key and the scan. */
const MAX_SEARCH_LENGTH = 100

/**
 * Free-text query, capped at parse time so an oversized `?q=` cannot key its own
 * cache entry. Sliced by code point, so it never splits a surrogate pair.
 *
 * Deliberately does not trim: this parser also drives the client's
 * `useQueryStates`, and trimming there deletes the space the moment you type it.
 */
export const parseAsSearch = createParser({
  parse: value => Array.from(value).slice(0, MAX_SEARCH_LENGTH).join(""),
  serialize: (value: string) => value,
}).withDefault("")

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

/** The A–Z index's catch-all bucket: names starting with anything else. */
export const NON_ALPHA_LETTER = "&"

/**
 * Alphabetical index filter, collapsed to A–Z, the catch-all bucket, or unset.
 * Without it, `?letter=whatever` is its own cache key for the catch-all's results.
 */
export const parseAsLetter = createParser({
  parse: value => {
    const letter = value.trim().toUpperCase()

    if (!letter) {
      return null
    }

    return ALPHABET.includes(letter) ? letter : NON_ALPHA_LETTER
  },
  serialize: value => value,
}).withDefault("")

export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
})

export type SortItem = z.infer<typeof sortItemSchema>

/**
 * Creates a parser for TanStack Table sorting state.
 * @param originalRow The original row data to validate sorting keys against.
 * @returns A parser for TanStack Table sorting state.
 */
export function getSortingStateParser<TData>(originalRow?: Row<TData>["original"]) {
  const validKeys = originalRow ? new Set(Object.keys(originalRow)) : null

  return createParser<ExtendedSortingState<TData>>({
    parse: value => {
      try {
        const parsed = JSON.parse(value)
        const result = z.array(sortItemSchema).safeParse(parsed)

        if (!result.success) {
          return null
        }

        if (validKeys && result.data.some(item => !validKeys.has(item.id))) {
          return null
        }

        return result.data as ExtendedSortingState<TData>
      } catch {
        return null
      }
    },
    serialize: value => JSON.stringify(value),
    eq: (first, second) =>
      first.length === second.length &&
      first.every(
        (item, index) => item.id === second[index]?.id && item.desc === second[index]?.desc,
      ),
  })
}

/**
 * Checks if the state is the default state.
 * @param parsers The parsers to check.
 * @param values The values to check.
 * @param excludeKeys Keys to exclude from the check.
 * @returns True if the state is the default state, false otherwise.
 */
export function isDefaultState<Parsers extends ParserMap>(
  parsers: Parsers,
  values: inferParserType<Parsers>,
  excludeKeys: (keyof Parsers)[] = [],
) {
  for (const key of Object.keys(parsers) as (keyof Parsers)[]) {
    if (excludeKeys.includes(key)) {
      continue
    }

    if (!parsers[key].eq(values[key], parsers[key].defaultValue)) {
      return false
    }
  }

  return true
}
