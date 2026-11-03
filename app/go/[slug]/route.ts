import { getClientIp, removeQueryParams, setQueryParams } from "@dirstack/utils"
import { after, type NextRequest, NextResponse } from "next/server"
import { mcpConfig } from "~/config/mcp"
import { siteConfig } from "~/config/site"
import { publiclyListedToolFilter } from "~/config/tool-statuses"
import { env } from "~/env"
import { findTool } from "~/server/tools/queries"
import { trackServerEvent } from "~/services/analytics"

// A short label for where the link was shown, such as `mcp`, recorded with the click.
const SOURCE_PATTERN = /^[\w-]{1,32}$/

/**
 * Sends a visitor to a tool's website, through its affiliate link when it has one, and records
 * the click. Links handed out off the site, such as by the MCP server, point here, because
 * neither the visitor's browser nor the assistant that showed the link reports the click.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/go/[slug]">) {
  const { slug } = await params
  const tool = await findTool({ where: { slug, ...publiclyListedToolFilter } })

  if (!tool) {
    return NextResponse.redirect(siteConfig.url)
  }

  const source = request.nextUrl.searchParams.get("source") ?? ""

  // A link the MCP server handed out uses the affiliate link only when `mcpConfig.affiliateLinks`
  // is on. An empty `affiliateUrl` string falls back to the website URL as well.
  const useAffiliateLink = source !== "mcp" || mcpConfig.affiliateLinks
  const target = (useAffiliateLink && tool.affiliateUrl) || tool.websiteUrl
  const href = target.includes("utm_source")
    ? target
    : setQueryParams(target, { utm_source: siteConfig.domain })

  trackServerEvent(
    "click_website",
    {
      url: removeQueryParams(tool.websiteUrl),
      tier: tool.tier,
      source: SOURCE_PATTERN.test(source) ? source : "go",
    },
    {
      request,
      ip: getClientIp(request.headers, { trust: env.TRUSTED_PROXY }) ?? undefined,
      waitUntil: after,
    },
  )

  const response = NextResponse.redirect(href)

  // Every click is a request of its own, so a cached redirect would go uncounted.
  response.headers.set("Cache-Control", "private, no-store")
  response.headers.set("X-Robots-Tag", "noindex")

  return response
}
