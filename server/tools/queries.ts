import {
  getDomain,
  getPageCount,
  getPagination,
  getRandomElement,
  getRandomNumber,
  isTruthy,
  sortBy,
} from "@dirstack/utils"
import { type Prisma, ToolStatus } from "~/.generated/prisma/client"
import { paginationConfig } from "~/config/pagination"
import {
  adminCalendarStatuses,
  publiclyListedToolFilter,
  queuedStatuses,
} from "~/config/tool-statuses"
import { withIdTiebreak } from "~/lib/parsers"
import { getNextPublishSlot } from "~/lib/tools"
import { createdAtRange, toOrderBy } from "~/server/shared/pagination"
import { getNameRank, getRankedPage, getSearchWords, toSearchQuery } from "~/server/shared/search"
import { toolManyPayload, toolOnePayload, toolOwnerPayload } from "~/server/tools/payloads"
import { toolSort, type ToolFilterParams, type ToolListParams } from "~/server/tools/schema"
import { getCanonicalWebsiteUrl } from "~/server/tools/utils"
import { db } from "~/services/db"

/**
 * Default public ordering: higher tiers first, then the most recently published.
 */
const publicToolOrderBy = withIdTiebreak<Prisma.ToolOrderByWithRelationInput>([
  { tierPriority: "asc" },
  { publishedAt: "desc" },
])

/**
 * Case-insensitive match of a search query, word by word. Every word must match
 * the tool's name, tagline or description, or one of its category or tag names.
 * Escape the query with `toSearchQuery` first.
 */
export function toolTextSearch(query: string) {
  return {
    AND: getSearchWords(query).map(word => ({
      OR: [
        { name: { contains: word, mode: "insensitive" } },
        { tagline: { contains: word, mode: "insensitive" } },
        { description: { contains: word, mode: "insensitive" } },
        { categories: { some: { name: { contains: word, mode: "insensitive" } } } },
        { tags: { some: { name: { contains: word, mode: "insensitive" } } } },
      ],
    })),
  } satisfies Prisma.ToolWhereInput
}

interface RankToolsOptions {
  /** Whether higher tiers break ties. Off where paid placement isn't allowed, such as MCP. */
  rankByTier?: boolean
}

/**
 * Ids of every tool matching `where`, ranked by how closely the name matches the
 * query (see `getNameRank`). Higher tiers, then newer tools, break ties.
 */
export async function findRankedToolIds(
  where: Prisma.ToolWhereInput,
  query: string,
  { rankByTier = true }: RankToolsOptions = {},
) {
  const matches = await db.tool.findMany({
    where,
    select: { id: true, name: true, tierPriority: true, publishedAt: true },
  })

  const ranked = sortBy(matches, [
    match => getNameRank(match.name, query),
    match => (rankByTier ? match.tierPriority : 0),
    { key: match => match.publishedAt ?? 0, order: "desc" },
    match => match.id,
  ])

  return ranked.map(match => match.id)
}

/**
 * The filter for a tool data table: the table's own filters plus the caller's scope.
 */
export function getToolListWhere(
  search: ToolListParams,
  where?: Prisma.ToolWhereInput,
): Prisma.ToolWhereInput {
  const { name, from, to, status } = search

  const expressions: (Prisma.ToolWhereInput | undefined)[] = [
    name ? { name: { contains: name, mode: "insensitive" } } : undefined,
    createdAtRange(from, to),
    status.length > 0 ? { status: { in: status } } : undefined,
  ]

  return { AND: [...expressions.filter(isTruthy), ...(where ? [where] : [])] }
}

/**
 * Admin table query. Paginated, filterable, sortable across the full set of
 * tools (any status), with every column. Used by `/app/tools` (admin) and by the
 * dashboard (filtered by ownership).
 */
export async function findTools(search: ToolListParams, where?: Prisma.ToolWhereInput) {
  const { sort, page, perPage } = search
  const whereQuery = getToolListWhere(search, where)

  const [tools, total] = await Promise.all([
    db.tool.findMany({
      where: whereQuery,
      orderBy: toOrderBy(sort),
      include: { owner: toolOwnerPayload },
      ...getPagination({ page, perPage }),
    }),

    db.tool.count({
      where: whereQuery,
    }),
  ])

  return { tools, total, pageCount: getPageCount(total, perPage) }
}

/**
 * Tools scheduled for publication within a date range. Powers the admin
 * calendar widget. Always filtered to admin-calendar statuses.
 */
export async function findScheduledTools({ where, ...args }: Prisma.ToolFindManyArgs = {}) {
  return db.tool.findMany({
    ...args,
    where: { status: { in: adminCalendarStatuses }, ...where },
    select: { id: true, slug: true, name: true, status: true, publishedAt: true },
    orderBy: { publishedAt: "asc" },
  })
}

/**
 * Flat id+name list for dropdown selectors (admin category/tag forms).
 */
export async function findToolList(args: Prisma.ToolFindManyArgs = {}) {
  return db.tool.findMany({
    ...args,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}

/**
 * Single-tool admin lookup (with relation ids for form editing).
 */
export async function findToolById(id: string) {
  return db.tool.findUnique({
    where: { id },
    include: {
      owner: toolOwnerPayload,
      categories: { select: { id: true } },
      tags: { select: { id: true } },
    },
  })
}

/**
 * Find an existing tool whose website resolves to the same canonical URL as the
 * given one, used by the submission flow to detect duplicates regardless of
 * protocol, `www`, trailing slashes, or query strings.
 */
export async function findDuplicateTool(websiteUrl: string) {
  const domain = getDomain(websiteUrl)
  const target = getCanonicalWebsiteUrl(websiteUrl)

  const candidates = await db.tool.findMany({
    where: { websiteUrl: { contains: domain, mode: "insensitive" } },
  })

  return (
    candidates.find(candidate => getCanonicalWebsiteUrl(candidate.websiteUrl) === target) ?? null
  )
}

/**
 * Public catalog search.
 */
export async function searchTools(search: ToolFilterParams, where?: Prisma.ToolWhereInput) {
  const { category, sort, page } = search
  const query = toSearchQuery(search.q)
  const orderBy = toolSort.resolve(sort)

  const perPage = paginationConfig.toolsPerPage

  const expressions: (Prisma.ToolWhereInput | undefined)[] = [
    // A caller's own status filter (e.g. the coming-soon collection) replaces the public one.
    where?.status ? undefined : publiclyListedToolFilter,
    category ? { categories: { some: { slug: category } } } : undefined,
    query ? toolTextSearch(query) : undefined,
    where,
  ]

  const whereQuery: Prisma.ToolWhereInput = {
    AND: expressions.filter(isTruthy),
  }

  // A search without a chosen sort is ordered by relevance. Ranking needs every match,
  // so it reads only the ranking fields and hydrates just the requested page.
  if (query && !orderBy) {
    const rankedIds = await findRankedToolIds(whereQuery, search.q)
    const { ids, total } = getRankedPage(rankedIds, rankedIds, { page, perPage })

    const tools = await db.tool.findMany({
      where: { id: { in: ids } },
      select: toolManyPayload,
    })

    return {
      tools: sortBy(tools, tool => ids.indexOf(tool.id)),
      page,
      pageCount: getPageCount(total, perPage),
    }
  }

  const [tools, total] = await Promise.all([
    db.tool.findMany({
      orderBy: orderBy ?? publicToolOrderBy,
      where: whereQuery,
      select: toolManyPayload,
      ...getPagination({ page, perPage }),
    }),

    db.tool.count({
      where: whereQuery,
    }),
  ])

  return { tools, page, pageCount: getPageCount(total, perPage) }
}

interface FindRelatedToolsArgs extends Prisma.ToolFindManyArgs {
  slug: string
}

/**
 * Related tools: same categories, different slug, randomized order. The
 * order re-rolls on every request, deliberately: it rotates which related
 * tools get seen. The random skip/order must stay below the awaited count
 * query. The uncached DB read postpones the prerender first, which is what
 * makes sync randomness legal here under cacheComponents.
 */
export async function findRelatedTools({ where, slug, ...args }: FindRelatedToolsArgs) {
  const relatedWhereClause = {
    AND: [
      publiclyListedToolFilter,
      { slug: { not: slug } },
      { categories: { some: { tools: { some: { slug } } } } },
      ...(where ? [where] : []),
    ],
  } satisfies Prisma.ToolWhereInput

  const take = 3
  const itemCount = await db.tool.count({ where: relatedWhereClause })
  const skip = Math.max(0, getRandomNumber(0, itemCount - 1) - take)
  const properties = ["id", "name"] satisfies (keyof Prisma.ToolOrderByWithRelationInput)[]
  const orderBy = getRandomElement(properties)!
  const orderDir = getRandomElement(["asc", "desc"] as const)

  return db.tool.findMany({
    ...args,
    where: relatedWhereClause,
    select: toolManyPayload,
    orderBy: { [orderBy]: orderDir },
    take,
    skip,
  })
}

/**
 * Public list of tools (publicly listed statuses only).
 * Used by category/tag pages and other RSC surfaces.
 */
export async function findPublicTools({ where, orderBy, ...args }: Prisma.ToolFindManyArgs = {}) {
  return db.tool.findMany({
    ...args,
    where: { ...publiclyListedToolFilter, ...where },
    orderBy: orderBy ?? publicToolOrderBy,
    select: toolManyPayload,
  })
}

/**
 * Slugs + updatedAt for sitemap generation.
 */
export async function findToolSlugs({ where, orderBy, ...args }: Prisma.ToolFindManyArgs = {}) {
  return db.tool.findMany({
    ...args,
    orderBy: orderBy ?? { name: "asc" },
    where: { ...publiclyListedToolFilter, ...where },
    select: { slug: true, updatedAt: true },
  })
}

/**
 * Count of pending/queued user submissions, used for admin badges. A submission always has
 * an owner, so tools an admin added without one don't count.
 */
export async function countSubmittedTools({ where, ...args }: Prisma.ToolCountArgs = {}) {
  return db.tool.count({
    ...args,
    where: {
      status: { in: queuedStatuses },
      ownerId: { not: null },
      ...where,
    },
  })
}

/**
 * A tool the user owns, for the actions only its owner may take on it. Returns `null` for
 * anyone else's tool.
 */
export async function findManagedTool(id: string, userId: string) {
  return db.tool.findFirst({
    where: { id, ownerId: userId },
    select: { id: true, slug: true, tier: true },
  })
}

/**
 * Single tool by slug (or any unique field), in any status.
 */
export async function findTool({ where, ...args }: Prisma.ToolFindFirstArgs = {}) {
  return db.tool.findFirst({
    ...args,
    where,
    select: toolOnePayload,
  })
}

/**
 * The next free publish slot for a tool: the first publish day after today that no other
 * scheduled listing holds.
 */
export async function findNextPublishSlot(toolId: string) {
  const now = new Date()

  const scheduled = await db.tool.findMany({
    where: { id: { not: toolId }, status: ToolStatus.Scheduled, publishedAt: { gt: now } },
    select: { publishedAt: true },
  })

  return getNextPublishSlot(scheduled.map(({ publishedAt }) => publishedAt).filter(isTruthy), now)
}
