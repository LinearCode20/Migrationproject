import { getTranslations } from "next-intl/server"
import { connection } from "next/server"
import { createFeed, feedResponse, getFeedUrl } from "~/lib/rss"
import { findPublicTools } from "~/server/tools/queries"

export async function GET() {
  // Request-time only, so the DB query is skipped at build. See https://dirstarter.com/docs/codebase/caching.
  await connection()

  const t = await getTranslations("navigation")
  const tools = await findPublicTools({ take: 50, orderBy: { publishedAt: "desc" } })
  const feed = await createFeed({ title: t("tools"), path: "/rss/tools.xml" })

  for (const tool of tools) {
    feed.item({
      guid: tool.websiteUrl,
      title: tool.name,
      url: getFeedUrl(`/${tool.slug}`),
      date: (tool.publishedAt ?? tool.updatedAt).toUTCString(),
      description: tool.description ?? "",
      categories: tool.categories.map(({ name }) => name),
    })
  }

  return feedResponse(feed)
}
