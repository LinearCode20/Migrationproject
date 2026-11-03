import {
  createSearchParamsCache,
  type inferParserType,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import { z } from "zod"
import { type Prisma, type Tool, ToolStatus, ToolTier } from "~/.generated/prisma/browser"
import { verificationsConfig } from "~/config/verifications"
import { createSortParser, parseAsPage, parseAsSearch } from "~/lib/parsers"
import { arrayable, createListParams, createListSchema } from "~/server/shared/list"
import { idSchema } from "~/server/shared/schemas"

const toolSortFields = [
  "name",
  "status",
  "createdAt",
  "updatedAt",
  "publishedAt",
  "tagline",
  "tier",
] as const

const toolDefaultSort = { id: "createdAt", desc: true } as const

export const toolListSchema = createListSchema(toolSortFields, toolDefaultSort).extend({
  name: z.string().default(""),
  status: arrayable(z.enum(ToolStatus)).default([]),
})

export type ToolListParams = z.infer<typeof toolListSchema>

export const toolListParams = {
  ...createListParams<Tool>(toolDefaultSort),
  name: parseAsString.withDefault(""),
  // Empty default = every status, matching the Zod input (`toolListSchema`).
  status: parseAsArrayOf(parseAsStringEnum(Object.values(ToolStatus))).withDefault([]),
}

export const toolSort = createSortParser<Prisma.ToolOrderByWithRelationInput>({
  "publishedAt.desc": { label: "sort_latest", orderBy: { publishedAt: "desc" } },
  "publishedAt.asc": { label: "sort_oldest", orderBy: { publishedAt: "asc" } },
  "name.asc": { label: "sort_name_asc", orderBy: { name: "asc" } },
  "name.desc": { label: "sort_name_desc", orderBy: { name: "desc" } },
})

export const toolFilterParams = {
  q: parseAsSearch,
  sort: toolSort.parser,
  page: parseAsPage,
  category: parseAsString.withDefault(""),
}

export const toolFilterParamsCache = createSearchParamsCache(toolFilterParams)

export type ToolFilterSchema = typeof toolFilterParams
export type ToolFilterParams = inferParserType<typeof toolFilterParams>

const toolFieldsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  websiteUrl: z.url({ protocol: /^https?$/, normalize: true }).min(1, "Website is required"),
  affiliateUrl: z.url().optional().or(z.literal("")),
  tagline: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  faviconUrl: z.string().optional(),
  screenshotUrl: z.string().optional(),
  tier: z.enum(ToolTier),
  submitterNote: z.string().optional(),
  publishedAt: z.coerce.date().nullish(),
  status: z.enum(ToolStatus),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notifyOwner: z.boolean(),
})

export const toolCreateSchema = toolFieldsSchema.extend({
  id: z.string().optional(),
  tier: z.enum(ToolTier).optional(),
  status: z.enum(ToolStatus).optional(),
  notifyOwner: z.boolean().default(true),
})

export const toolUpdateSchema = toolFieldsSchema.partial().extend({
  ...idSchema.shape,
  notifyOwner: z.boolean().default(true),
})

export type ToolSchema = z.infer<typeof toolCreateSchema>

export const toolSubmitSchema = z.object({
  name: z.string().trim().min(1).max(100),
  websiteUrl: z.url({ protocol: /^https?$/, normalize: true }).min(1),
  submitterNote: z.string().max(256),
})

export const toolVerificationOtpRequestSchema = z.object({
  toolId: z.string(),
  email: z.email(),
})

export const toolVerificationOtpConfirmSchema = z.object({
  toolId: z.string(),
  otp: z.string().length(verificationsConfig.otpLength),
})

export const toolScheduledSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
})

export const toolDuplicateSchema = z.object({
  websiteUrl: z.url({ protocol: /^https?$/, normalize: true }),
})

export const toolEnrichSchema = idSchema.extend({
  overwrite: z.array(z.enum(["copy", "favicon", "screenshot"])).default([]),
})

export const toolScheduleSchema = idSchema.extend({
  publishedAt: z.coerce.date().optional(),
  notifyOwner: z.boolean().default(true),
})
