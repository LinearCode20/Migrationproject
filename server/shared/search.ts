import { getPagination } from "@dirstack/utils"

/**
 * Most words of a query that become search conditions. Each word adds an `OR`
 * across several columns and relations, so a long query cannot build a huge `WHERE`.
 */
const MAX_SEARCH_WORDS = 8

/**
 * Prepare a free-text query for a Prisma `contains`/`startsWith` filter.
 *
 * Prisma does not escape `LIKE` metacharacters, so an unescaped `%` or `_` is a
 * wildcard: `?q=%` matches every row, and a pattern of alternating `%_` is about
 * the most expensive scan an anonymous visitor could ask for. Length is already
 * bounded by `parseAsSearch`; this only fixes the semantics.
 */
export function toSearchQuery(query: string) {
  return query.trim().replace(/[\\%_]/g, char => `\\${char}`)
}

/**
 * Split an escaped query (see `toSearchQuery`) into its unique words, capped at
 * `MAX_SEARCH_WORDS`. A search matches when every word matches somewhere.
 */
export function getSearchWords(query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  return [...new Set(words)].slice(0, MAX_SEARCH_WORDS)
}

/**
 * How closely a name matches a search query, lower is closer: an exact match,
 * then a prefix, then a substring, then every query word in any order, then a
 * match on other fields only.
 */
export function getNameRank(name: string, query: string) {
  const normalizedName = name.trim().toLowerCase()
  const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, " ")

  if (normalizedName === normalizedQuery) {
    return 0
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return 1
  }

  if (normalizedName.includes(normalizedQuery)) {
    return 2
  }

  if (getSearchWords(query).every(word => normalizedName.includes(word))) {
    return 3
  }

  return 4
}

interface RankedPageOptions {
  page: number
  perPage: number
}

/**
 * One page of ranked ids, cut after dropping the ids the database filtered out, so
 * relevance order survives the listing's own filters. `total` counts every id kept.
 */
export function getRankedPage(
  rankedIds: string[],
  matchingIds: string[],
  { page, perPage }: RankedPageOptions,
) {
  const matching = new Set(matchingIds)
  const ids = rankedIds.filter(id => matching.has(id))
  const { skip, take } = getPagination({ page, perPage })

  return { ids: ids.slice(skip, skip + take), total: ids.length }
}
