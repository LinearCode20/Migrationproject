import type { Prisma } from "~/.generated/prisma/client"
import { categoryLinkPayload } from "~/server/categories/payloads"
import { tagLinkPayload } from "~/server/tags/payloads"

export const toolCategoriesPayload = {
  select: categoryLinkPayload,
  orderBy: { name: "asc" },
} satisfies Prisma.Tool$categoriesArgs

export const toolTagsPayload = {
  select: tagLinkPayload,
  orderBy: { name: "asc" },
} satisfies Prisma.Tool$tagsArgs

/**
 * The owner as the admin sees it. The public payloads leave the owner out.
 */
export const toolOwnerPayload = {
  select: { id: true, name: true, email: true },
} satisfies Prisma.UserDefaultArgs

export const toolOnePayload = {
  id: true,
  name: true,
  slug: true,
  websiteUrl: true,
  affiliateUrl: true,
  tagline: true,
  description: true,
  content: true,
  faviconUrl: true,
  screenshotUrl: true,
  tier: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  categories: toolCategoriesPayload,
  tags: toolTagsPayload,
} satisfies Prisma.ToolSelect

export const toolManyPayload = {
  id: true,
  name: true,
  slug: true,
  websiteUrl: true,
  affiliateUrl: true,
  tagline: true,
  description: true,
  faviconUrl: true,
  tier: true,
  publishedAt: true,
  updatedAt: true,
  verifiedAt: true,
  categories: toolCategoriesPayload,
} satisfies Prisma.ToolSelect

export type ToolWithOwner = Prisma.ToolGetPayload<{ include: { owner: typeof toolOwnerPayload } }>
export type ToolOne = Prisma.ToolGetPayload<{ select: typeof toolOnePayload }>
export type ToolMany = Prisma.ToolGetPayload<{ select: typeof toolManyPayload }>
