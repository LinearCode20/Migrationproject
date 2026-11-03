import { getPagination, sortBy } from "@dirstack/utils"
import type { Prisma } from "~/.generated/prisma/client"
import { siteConfig } from "~/config/site"
import { publiclyListedToolFilter } from "~/config/tool-statuses"
import { withIdTiebreak } from "~/lib/parsers"
import { getToolTiersWith } from "~/lib/tools"
import { findPublicCategories } from "~/server/categories/queries"
import { ensureFound } from "~/server/orpc/helpers"
import { publicProcedure } from "~/server/orpc/procedure"
import {
  searchItemsSchema,
  searchToolBySlugSchema,
  searchToolsSchema,
} from "~/server/search/schema"
import { toAgentCategory, toAgentTool, toAgentToolDetail } from "~/server/search/utils"
import { getNameRank, getRankedPage, getSearchWords, toSearchQuery } from "~/server/shared/search"
import { findPublicTags } from "~/server/tags/queries"
import {
  findPublicTools,
  findRankedToolIds,
  findTool,
  toolTextSearch,
} from "~/server/tools/queries"

/** Most results the command menu lists per group. */
const SEARCH_ITEMS_LIMIT = 10

const publicSearch = publicProcedure.meta({
  permission: "search.read",
})

/**
 * Case-insensitive match of every word of an escaped query against a name.
 */
function nameTextSearch(query: string) {
  return {
    AND: getSearchWords(query).map(word => ({
      name: { contains: word, mode: "insensitive" as const },
    })),
  }
}

/**
 * The closest names first (see `getNameRank`), cut to the command menu's limit.
 */
function rankByName<T extends { name: string }>(items: T[], query: string) {
  return sortBy(items, item => getNameRank(item.name, query)).slice(0, SEARCH_ITEMS_LIMIT)
}

export const search = {
  searchItems: publicSearch.input(searchItemsSchema).handler(async ({ input }) => {
    const query = toSearchQuery(input.query)

    if (!query) {
      return { tools: [], categories: [], tags: [] }
    }

    // Every match is read so the closest names come first, the way the catalog ranks them.
    const [rankedToolIds, categories, tags] = await Promise.all([
      findRankedToolIds({ ...publiclyListedToolFilter, ...toolTextSearch(query) }, input.query),
      findPublicCategories({ where: nameTextSearch(query) }),
      findPublicTags({ where: nameTextSearch(query) }),
    ])

    const toolIds = rankedToolIds.slice(0, SEARCH_ITEMS_LIMIT)
    const tools = await findPublicTools({ where: { id: { in: toolIds } } })

    return {
      tools: sortBy(tools, tool => toolIds.indexOf(tool.id)),
      categories: rankByName(categories, input.query),
      tags: rankByName(tags, input.query),
    }
  }),

  findFeaturedTools: publicSearch.handler(async () =>
    findPublicTools({ where: { tier: { in: getToolTiersWith("featuredPlacement") } } }),
  ),

  /**
   * Tools for an AI agent, by relevance alone: assistant directories ban paid placement, so tiers
   * play no part in the order.
   */
  tools: publicSearch
    .meta({
      mcp: {
        name: "search_tools",
        description: `Use this when the user wants software for a need, or asks about a tool by name, and the ${siteConfig.name} directory may list it. Matches \`query\` against names, descriptions, categories and tags. \`category\` takes a slug from list_categories. Returns \`tools\`, each with its listing \`url\` and \`websiteUrl\`, and \`hasMore\` when another \`page\` exists.`,
        annotations: { title: "Search tools", readOnlyHint: true, openWorldHint: false },
      },
    })
    .input(searchToolsSchema)
    .handler(async ({ input: { query, category, limit, page } }) => {
      const searchQuery = toSearchQuery(query)

      const where = {
        ...publiclyListedToolFilter,
        ...(category && { categories: { some: { slug: category } } }),
        ...(searchQuery && toolTextSearch(searchQuery)),
      }

      if (searchQuery) {
        const rankedIds = await findRankedToolIds(where, query, { rankByTier: false })
        const { ids, total } = getRankedPage(rankedIds, rankedIds, { page, perPage: limit })
        const tools = await findPublicTools({ where: { id: { in: ids } } })

        return {
          tools: sortBy(tools, tool => ids.indexOf(tool.id)).map(toAgentTool),
          hasMore: total > page * limit,
        }
      }

      // Without a query, the newest tools come first. One extra row tells whether a next page
      // exists.
      const { skip, take } = getPagination({ page, perPage: limit })

      const tools = await findPublicTools({
        where,
        orderBy: withIdTiebreak<Prisma.ToolOrderByWithRelationInput>([{ publishedAt: "desc" }]),
        skip,
        take: take + 1,
      })

      return { tools: tools.slice(0, limit).map(toAgentTool), hasMore: tools.length > limit }
    }),

  tool: publicSearch
    .meta({
      mcp: {
        name: "get_tool",
        description:
          "Use this when the user wants the details of one tool from search_tools: its full description (Markdown), categories, tags and links. Takes the tool's `slug`.",
        annotations: { title: "Get a tool", readOnlyHint: true, openWorldHint: false },
      },
    })
    .input(searchToolBySlugSchema)
    .handler(async ({ input: { slug } }) => {
      const tool = await findTool({ where: { slug, ...publiclyListedToolFilter } })
      return toAgentToolDetail(ensureFound(tool, "Tool"))
    }),

  categories: publicSearch
    .meta({
      mcp: {
        name: "list_categories",
        description:
          "Use this when the user wants to browse the directory by topic, or to get a category slug for search_tools. Returns every category with its tool count.",
        annotations: { title: "List categories", readOnlyHint: true, openWorldHint: false },
      },
    })
    .handler(async () => (await findPublicCategories()).map(toAgentCategory)),
}
