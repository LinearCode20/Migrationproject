import { createSearchParamsCache, type inferParserType, parseAsString } from "nuqs/server"
import { z } from "zod"
import type { Prisma, Tag } from "~/.generated/prisma/browser"
import { createSortParser, parseAsLetter, parseAsPage, parseAsSearch } from "~/lib/parsers"
import { createListParams, createListSchema } from "~/server/shared/list"
import { idSchema } from "~/server/shared/schemas"

const tagSortFields = ["name", "createdAt", "updatedAt"] as const

const tagDefaultSort = { id: "name", desc: false } as const

export const tagListSchema = createListSchema(tagSortFields, tagDefaultSort).extend({
  name: z.string().default(""),
})

export type TagListParams = z.infer<typeof tagListSchema>

export const tagListParams = {
  ...createListParams<Tag>(tagDefaultSort),
  name: parseAsString.withDefault(""),
}

export const tagSort = createSortParser<Prisma.TagOrderByWithRelationInput>({
  "name.asc": { label: "sort_name_asc", orderBy: { name: "asc" } },
  "name.desc": { label: "sort_name_desc", orderBy: { name: "desc" } },
})

export const tagFilterParams = {
  q: parseAsSearch,
  sort: tagSort.parser,
  page: parseAsPage,
  letter: parseAsLetter,
}

export const tagFilterParamsCache = createSearchParamsCache(tagFilterParams)

export type TagFilterSchema = typeof tagFilterParams
export type TagFilterParams = inferParserType<typeof tagFilterParams>

const tagFieldsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  tools: z.array(z.string()).optional(),
})

export const tagCreateSchema = tagFieldsSchema.extend({
  id: z.string().optional(),
})

export const tagUpdateSchema = tagFieldsSchema.partial().extend(idSchema.shape)
