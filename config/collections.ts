import { CalendarDaysIcon, ClockIcon, type LucideIcon, SparklesIcon } from "lucide-react"
import type { ComponentProps } from "react"
import type { Prisma } from "~/.generated/prisma/client"
import { ToolStatus, ToolTier } from "~/.generated/prisma/enums"
import type { ToolQuery } from "~/components/web/tools/tool-query"

type ToolQueryProps = ComponentProps<typeof ToolQuery>

export interface Collection {
  /** URL segment under `/collections/` and i18n key under `pages.collections`. */
  slug: string
  /** Icon representing the collection (cards, nav). Owned here, not the entity icons. */
  icon: LucideIcon
  /** Merged into the public tool query's `where`. */
  where: Prisma.ToolWhereInput
  /** Forced filter params (e.g. a default sort). */
  overrideParams?: ToolQueryProps["overrideParams"]
  /** Listing toggles (filters/sort). */
  options?: ToolQueryProps["options"]
  /** Surface this collection in the header navigation menu. */
  nav?: boolean
  /** Optional i18n key for a badge shown next to the nav entry (e.g. "New"). */
  badge?: string
}

/**
 * Curated listings, each a saved filter over the public tool query. Add an entry
 * here and the collection gets a page, a nav slot, a footer link, a card on
 * `/collections`, and a sitemap entry; no other file needs touching.
 */
export const collections: Collection[] = [
  {
    slug: "latest",
    icon: CalendarDaysIcon,
    where: {},
    overrideParams: { sort: "publishedAt.desc" },
    options: { enableFilters: true, enableSort: false },
    nav: true,
  },
  {
    slug: "featured",
    icon: SparklesIcon,
    where: { tier: { not: ToolTier.Free } },
    options: { enableFilters: true },
    nav: true,
  },
  {
    slug: "coming-soon",
    icon: ClockIcon,
    where: { status: ToolStatus.Scheduled },
    overrideParams: { sort: "publishedAt.asc" },
    options: { enableSort: false },
    nav: true,
  },
]

export function getCollection(slug: string) {
  return collections.find(collection => collection.slug === slug)
}
