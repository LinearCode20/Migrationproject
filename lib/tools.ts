import { getDomain, isWithinDomain } from "@dirstack/utils"
import { differenceInDays } from "date-fns"
import { type Tool, type ToolTier, ToolStatus, type User } from "~/.generated/prisma/browser"
import { submissionsConfig } from "~/config/submissions"
import { tiersConfig } from "~/config/tiers"
import { toolStatusConfig } from "~/config/tool-statuses"

type TierCapability = keyof (typeof tiersConfig)[ToolTier]["capabilities"]

/**
 * Check if a tool's tier has a given capability.
 *
 * @param tool - The tool to check.
 * @param capability - The capability to check for.
 * @returns Whether the tool's tier has the capability.
 */
export function hasToolTierCap(tool: Pick<Tool, "tier">, capability: TierCapability) {
  return tiersConfig[tool.tier].capabilities[capability]
}

/**
 * Check if a value names a configured tier, such as a tier read from Stripe metadata.
 * `Object.hasOwn` keeps inherited keys like `toString` from passing.
 *
 * @param value - The value to check.
 * @returns Whether the value is a tier.
 */
export function isToolTier(value: unknown): value is ToolTier {
  return typeof value === "string" && Object.hasOwn(tiersConfig, value)
}

/**
 * Get the priority rank of a tool's tier.
 *
 * @param tool - The tool to check.
 * @returns The numeric priority of the tool's tier.
 */
export function getToolTierRank(tool: Pick<Tool, "tier">) {
  return tiersConfig[tool.tier].priority
}

/**
 * Check if a tier ranks above a tool's current tier, so buying it upgrades the tool.
 *
 * @param tool - The tool to check.
 * @param tier - The tier to compare against.
 * @returns Whether the tier is an upgrade for the tool.
 */
export function isToolTierUpgrade(tool: Pick<Tool, "tier">, tier: ToolTier) {
  return getToolTierRank({ tier }) > getToolTierRank(tool)
}

const maxTierPriority = Math.max(...Object.values(tiersConfig).map(tier => tier.priority))

/**
 * Check if a tool has the highest tier.
 *
 * @param tool - The tool to check.
 * @returns Whether the tool has the top tier.
 */
export function isToolTopTier(tool: Pick<Tool, "tier">) {
  return tiersConfig[tool.tier].priority === maxTierPriority
}

/**
 * Get the hours a paid listing waits for review, the time the listing products and the
 * upgrade emails promise.
 *
 * @param tool - The tool to check.
 * @returns The review time in hours.
 */
export function getToolReviewHours(tool: Pick<Tool, "tier">) {
  return isToolTopTier(tool) ? 12 : 24
}

/**
 * Get all tiers that have a given capability.
 *
 * @param capability - The capability to filter by.
 * @returns The list of tiers with the capability.
 */
export function getToolTiersWith(capability: TierCapability) {
  return Object.entries(tiersConfig)
    .filter(([, config]) => config.capabilities[capability])
    .map(([tier]) => tier as ToolTier)
}

/**
 * Check if a link in a tool's content passes link equity. Only a tier with the `doFollow`
 * capability qualifies, and only for links to the tool's own website or its subdomains.
 * A link to any other site stays nofollow, since the tier pays for the tool's backlink alone.
 *
 * @param tool - The tool whose content holds the link.
 * @param url - The link URL.
 * @returns Whether the link is dofollow.
 */
export function isToolDoFollowUrl(tool: Pick<Tool, "tier" | "websiteUrl">, url: string) {
  if (!hasToolTierCap(tool, "doFollow")) {
    return false
  }

  return isWithinDomain(getDomain(url), getDomain(tool.websiteUrl))
}

/**
 * Whether an email address sits on the same domain as a website URL.
 */
export function isEmailOnDomain(email: string, url: string) {
  const emailDomain = email.split("@")[1]?.toLowerCase()
  return !!emailDomain && emailDomain === getDomain(url).toLowerCase()
}

/**
 * Whether a user's verified email sits on a website's domain, which proves they control it.
 * An OAuth provider can sign someone in with an email it has not verified, and that email
 * proves nothing.
 */
export function isUserOnDomain(
  user: Pick<User, "email" | "emailVerified"> | undefined,
  url: string,
) {
  return !!user?.emailVerified && isEmailOnDomain(user.email, url)
}

/**
 * Whether a user becomes a tool's owner by submitting or paying for it. A tool without an owner
 * goes to the first user. Only proving the domain of an unverified tool takes it from its owner.
 */
export function canOwnTool(
  tool: Pick<Tool, "ownerId" | "verifiedAt" | "websiteUrl">,
  user: Pick<User, "id" | "email" | "emailVerified">,
) {
  if (!tool.ownerId || tool.ownerId === user.id) {
    return true
  }

  return !tool.verifiedAt && isUserOnDomain(user, tool.websiteUrl)
}

/**
 * Check if a tool is publicly listed (appears in search, listings, RSS, sitemap, count).
 *
 * @param tool - The tool to check.
 * @returns Whether the tool is publicly listed.
 */
export function isToolPubliclyVisible(tool: Pick<Tool, "status">) {
  return toolStatusConfig[tool.status].publiclyListed
}

/**
 * Check if a tool is in the `Published` state. Distinct from
 * `isToolPubliclyVisible`, which is the broader "appears on the site" rule.
 *
 * @param tool - The tool to check.
 * @returns Whether the tool's status is `Published`.
 */
export function isToolPublished(tool: Pick<Tool, "status">) {
  return tool.status === ToolStatus.Published
}

/**
 * Check if a tool's owner can embed it (badge widget, embed dialog).
 *
 * @param tool - The tool to check.
 * @returns Whether the tool can be embedded.
 */
export function isToolEmbeddable(tool: Pick<Tool, "status">) {
  return toolStatusConfig[tool.status].ownerCanEmbed
}

/**
 * Check if a tool is within the expedite threshold.
 *
 * @param tool - The tool to check.
 * @returns Whether the tool is within the expedite threshold.
 */
export function isToolWithinExpediteThreshold(tool: Pick<Tool, "publishedAt">) {
  const threshold = submissionsConfig.expediteThreshold

  return tool.publishedAt && differenceInDays(tool.publishedAt, new Date()) < threshold
}

/**
 * A date's UTC day, such as `2026-10-28`.
 */
function toUtcDayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

/**
 * The first publish day after `from` that no scheduled listing holds yet, at midnight UTC.
 * Publish days come from `submissionsConfig.publishDays`, and each holds one listing.
 *
 * @param scheduledDates - The publish dates of the listings already scheduled.
 * @param from - The moment to schedule after. The slot is never on the same day.
 * @returns The date of the next free slot.
 */
export function getNextPublishSlot(scheduledDates: Date[], from = new Date()) {
  const taken = new Set(scheduledDates.map(toUtcDayKey))
  const day = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))

  do {
    day.setUTCDate(day.getUTCDate() + 1)
  } while (!submissionsConfig.publishDays.includes(day.getUTCDay()) || taken.has(toUtcDayKey(day)))

  return day
}
