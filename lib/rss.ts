import { HOUR_SECONDS, setQueryParams } from "@dirstack/utils"
import { getTranslations } from "next-intl/server"
import RSS from "rss"
import { siteConfig } from "~/config/site"
import { defaultLocale } from "~/lib/i18n-config"

// Feed and cache lifetime in seconds.
const FEED_TTL = 4 * HOUR_SECONDS

/**
 * Tags a site path with the RSS UTM params, so feed traffic shows up in analytics.
 */
export function getFeedUrl(path = "") {
  return setQueryParams(`${siteConfig.url}${path}`, {
    utm_source: siteConfig.domain,
    utm_medium: "rss",
  })
}

interface CreateFeedProps {
  title: string
  path: string
}

/**
 * Creates an RSS feed with the site-wide channel fields.
 * @param title - The feed title, suffixed with the site name
 * @param path - The feed's own path, e.g. `/rss/posts.xml`
 */
export async function createFeed({ title, path }: CreateFeedProps) {
  const t = await getTranslations("brand")
  const { url, name } = siteConfig

  return new RSS({
    title: `${title} – ${name}`,
    description: t("description"),
    site_url: getFeedUrl(),
    feed_url: `${url}${path}`,
    copyright: `${new Date().getFullYear()} ${name}`,
    language: defaultLocale,
    ttl: FEED_TTL / 60,
    pubDate: new Date(),
  })
}

/**
 * Serializes a feed into a cacheable XML response.
 */
export function feedResponse(feed: RSS) {
  return new Response(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/xml",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": `public, max-age=${FEED_TTL}, s-maxage=${FEED_TTL}, stale-while-revalidate=${FEED_TTL}`,
    },
  })
}
