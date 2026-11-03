import { getPageCount, getPagination } from "@dirstack/utils"
import { bookmarkedToolPayload } from "~/server/bookmarks/payloads"
import { toOrderBy } from "~/server/shared/pagination"
import { getToolListWhere } from "~/server/tools/queries"
import type { ToolListParams } from "~/server/tools/schema"
import { db } from "~/services/db"

/**
 * Look up a single bookmark for a user/tool pair. Returns `null` if the
 * user has not bookmarked the tool.
 */
export async function findBookmark(userId: string, toolId: string) {
  return db.bookmark.findUnique({
    where: { userId_toolId: { userId, toolId } },
    select: { id: true },
  })
}

/**
 * List the tools a user has bookmarked, with the same filters, sorting and
 * pagination as the admin tool table.
 */
export async function findBookmarkedTools(userId: string, search: ToolListParams) {
  const { sort, page, perPage } = search
  const where = getToolListWhere(search, { bookmarks: { some: { userId } } })

  const [tools, total] = await Promise.all([
    db.tool.findMany({
      where,
      select: bookmarkedToolPayload,
      orderBy: toOrderBy(sort),
      ...getPagination({ page, perPage }),
    }),

    db.tool.count({ where }),
  ])

  return { tools, total, pageCount: getPageCount(total, perPage) }
}
