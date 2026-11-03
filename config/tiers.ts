import type { ComponentProps } from "react"
import { type ToolTier } from "~/.generated/prisma/browser"
import type { Badge } from "~/components/common/badge"

interface TierCapabilities {
  doFollow: boolean
  featuredPlacement: boolean
  goldVerified: boolean
}

interface TierConfig {
  label: string
  priority: number
  badge: ComponentProps<typeof Badge>
  capabilities: TierCapabilities
}

// Single source of truth for tier capabilities.
// NOTE: If you add a new tier here, also update the `tierPriority` generated column
// in the database migration (see prisma/migrations).
export const tiersConfig: Record<ToolTier, TierConfig> = {
  Free: {
    label: "Free Listing",
    priority: 0,
    badge: { variant: "soft" },
    capabilities: { doFollow: false, featuredPlacement: false, goldVerified: false },
  },
  Standard: {
    label: "Standard Listing",
    priority: 1,
    badge: { variant: "info" },
    capabilities: { doFollow: true, featuredPlacement: false, goldVerified: false },
  },
  Premium: {
    label: "Premium Listing",
    priority: 2,
    badge: { variant: "success" },
    capabilities: { doFollow: true, featuredPlacement: true, goldVerified: true },
  },
}
