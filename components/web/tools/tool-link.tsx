"use client"

import { removeQueryParams } from "@dirstack/utils"
import { ExternalLink, type ExternalLinkBaseProps } from "~/components/web/external-link"
import { hasToolTierCap } from "~/lib/tools"
import type { ToolMany, ToolOne } from "~/server/tools/payloads"

interface ToolLinkProps extends ExternalLinkBaseProps {
  tool: ToolOne | ToolMany
  source: string
}

/**
 * Tracked outbound link to a tool's website. A client component, so server
 * components can pass it as a `render` element without losing merged children.
 */
export function ToolLink({ tool, source, ...props }: ToolLinkProps) {
  return (
    <ExternalLink
      // An empty `affiliateUrl` string falls back to the website URL as well.
      href={tool.affiliateUrl || tool.websiteUrl}
      doFollow={hasToolTierCap(tool, "doFollow")}
      // An affiliate link is a paid link whatever the tier.
      sponsored={!!tool.affiliateUrl}
      doTrack
      // Sends the full page URL, not only the origin, so the tool's own analytics show which
      // listing the visit came from and its maker can find the page.
      referrerPolicy="no-referrer-when-downgrade"
      eventName="click_website"
      eventProps={{ url: removeQueryParams(tool.websiteUrl), tier: tool.tier, source }}
      {...props}
    />
  )
}
