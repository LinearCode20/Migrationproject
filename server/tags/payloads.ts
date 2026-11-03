import type { Prisma } from "~/.generated/prisma/client"
import { publiclyListedToolFilter } from "~/config/tool-statuses"

/** Just enough to link to a tag, for the tags listed on another entity. */
export const tagLinkPayload = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.TagSelect

export const tagManyPayload = {
  ...tagLinkPayload,
  _count: { select: { tools: { where: publiclyListedToolFilter } } },
} satisfies Prisma.TagSelect
