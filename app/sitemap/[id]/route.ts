import { dayKey, HOUR_SECONDS } from "@dirstack/utils"
import { connection, NextResponse } from "next/server"
import { collections } from "~/config/collections"
import { siteConfig } from "~/config/site"
import { sitemaps } from "~/config/sitemaps"
import { findCategorySlugs } from "~/server/categories/queries"
import { findPostSlugs } from "~/server/posts/queries"
import { findToolSlugs } from "~/server/tools/queries"

interface SitemapEntry {
  url: string
  lastModified?: Date
  changeFrequency?: "daily" | "weekly" | "monthly"
  priority?: number
}

function buildSitemapXML(entries: SitemapEntry[]) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'

  for (const entry of entries) {
    xml += "<url>"
    xml += `<loc>${entry.url}</loc>`
    if (entry.lastModified) {
      xml += `<lastmod>${dayKey(entry.lastModified)}</lastmod>`
    }
    if (entry.changeFrequency) {
      xml += `<changefreq>${entry.changeFrequency}</changefreq>`
    }
    if (entry.priority) {
      xml += `<priority>${entry.priority}</priority>`
    }
    xml += "</url>"
  }

  xml += "</urlset>"
  return xml
}

export async function GET(_: Request, { params }: RouteContext<"/sitemap/[id]">) {
  // Request-time only, so the DB queries are skipped at build. See https://dirstarter.com/docs/codebase/caching.
  await connection()

  const { id } = await params

  if (!(sitemaps as readonly string[]).includes(id)) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    })
  }

  const siteUrl = siteConfig.url

  let entries: SitemapEntry[] = []

  switch (id) {
    case "pages": {
      const pages = [
        `${siteUrl}/`,
        `${siteUrl}/about`,
        `${siteUrl}/categories`,
        `${siteUrl}/tags`,
        `${siteUrl}/blog`,
        `${siteUrl}/advertise`,
        `${siteUrl}/collections`,
        ...collections.map(({ slug }) => `${siteUrl}/collections/${slug}`),
      ]

      entries = pages.map(url => ({
        url,
        changeFrequency: "daily",
        priority: 0.8,
      }))
      break
    }

    case "tools": {
      const tools = await findToolSlugs()

      entries = tools.map(tool => ({
        url: `${siteUrl}/${tool.slug}`,
        lastModified: tool.updatedAt,
        changeFrequency: "daily",
        priority: 0.8,
      }))
      break
    }

    case "categories": {
      const categories = await findCategorySlugs()

      entries = categories.map(category => ({
        url: `${siteUrl}/categories/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
      break
    }

    case "posts": {
      const posts = await findPostSlugs()

      entries = posts.map(post => ({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly",
        priority: 0.7,
      }))
      break
    }
  }

  const xml = buildSitemapXML(entries)

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": `public, max-age=${HOUR_SECONDS}, s-maxage=${HOUR_SECONDS}, stale-while-revalidate=${HOUR_SECONDS}`,
    },
  })
}
