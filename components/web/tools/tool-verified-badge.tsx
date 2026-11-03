import type { ComponentProps } from "react"
import type { Tool } from "~/.generated/prisma/browser"
import { VerifiedBadge } from "~/components/web/verified-badge"
import { hasToolTierCap } from "~/lib/tools"

interface ToolVerifiedBadgeProps extends Omit<ComponentProps<typeof VerifiedBadge>, "variant"> {
  tool: Pick<Tool, "tier" | "verifiedAt">
}

export function ToolVerifiedBadge({ tool, ...props }: ToolVerifiedBadgeProps) {
  if (hasToolTierCap(tool, "goldVerified")) {
    return <VerifiedBadge variant="gold" {...props} />
  }
  if (tool.verifiedAt) {
    return <VerifiedBadge {...props} />
  }
  return null
}
