import type { Prisma } from "~/.generated/prisma/client"
import { publiclyListedToolFilter } from "~/config/tool-statuses"

/** Just enough to link to a category, for the categories listed on another entity. */
export const categoryLinkPayload = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.CategorySelect

export const categoryOnePayload = {
  ...categoryLinkPayload,
  label: true,
  description: true,
  _count: { select: { tools: { where: publiclyListedToolFilter } } },
} satisfies Prisma.CategorySelect

export const categoryManyPayload = {
  ...categoryLinkPayload,
  label: true,
  _count: { select: { tools: { where: publiclyListedToolFilter } } },
} satisfies Prisma.CategorySelect

export type CategoryMany = Prisma.CategoryGetPayload<{ select: typeof categoryManyPayload }>
