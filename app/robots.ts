import type { MetadataRoute } from "next"
import { siteConfig } from "~/config/site"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url

  return {
    rules: [
      {
        userAgent: "*",
        // Social crawlers read `robots.txt` too, so the Open Graph images stay allowed.
        allow: ["/", "/api/og"],
        // The trailing slashes keep tool pages such as `/apify` or `/authy` crawlable.
        disallow: ["/admin/", "/app/", "/auth/", "/api/", "/go/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
