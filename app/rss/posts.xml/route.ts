import { truncate } from "@dirstack/utils"
import { getTranslations } from "next-intl/server"
import { connection } from "next/server"
import { createFeed, feedResponse, getFeedUrl } from "~/lib/rss"
import { findPublicPosts } from "~/server/posts/queries"

export async function GET() {
  // Request-time only, so the DB query is skipped at build. See https://dirstarter.com/docs/codebase/caching.
  await connection()

  const t = await getTranslations("navigation")
  const posts = await findPublicPosts({ take: 50, where: { publishedAt: { lte: new Date() } } })
  const feed = await createFeed({ title: t("blog"), path: "/rss/posts.xml" })

  for (const post of posts) {
    const postUrl = getFeedUrl(`/blog/${post.slug}`)

    feed.item({
      guid: postUrl,
      title: post.title,
      url: postUrl,
      date: (post.publishedAt ?? post.updatedAt).toUTCString(),
      // An empty description falls back to the post excerpt too.
      description: post.description || truncate(post.plainText, 300),
    })
  }

  return feedResponse(feed)
}
