import type Stripe from "stripe"
import { type Tool, ToolTier } from "~/.generated/prisma/client"
import { isToolTier } from "~/lib/tools"

/**
 * The Stripe metadata that ties a checkout, its invoice and its subscription to a listing.
 * Lookups use `toolId`, because the slug changes when an admin renames the tool. `tool`
 * keeps the slug readable in the Stripe dashboard. `previousTier` is the tier a cancelled
 * subscription returns the tool to.
 */
export function toListingMetadata(tool: Pick<Tool, "id" | "slug" | "tier">, tier: ToolTier) {
  return { toolId: tool.id, tool: tool.slug, tier, previousTier: tool.tier }
}

function getListingToolWhere(metadata?: Stripe.Metadata | null) {
  if (metadata?.toolId) {
    return { id: metadata.toolId }
  }

  if (metadata?.tool) {
    return { slug: metadata.tool }
  }
}

/**
 * Read the listing metadata from a Stripe object. Returns `undefined` for objects that
 * don't belong to a listing. Metadata without a `toolId` falls back to the slug.
 */
export function parseListingMetadata(metadata?: Stripe.Metadata | null) {
  const where = getListingToolWhere(metadata)

  if (!where) {
    return
  }

  return {
    where,
    tier: isToolTier(metadata?.tier) ? metadata.tier : undefined,
    previousTier: isToolTier(metadata?.previousTier) ? metadata.previousTier : ToolTier.Free,
  }
}
