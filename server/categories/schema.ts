import { parseAsString } from "nuqs/server"
import { z } from "zod"
import type { Category } from "~/.generated/prisma/browser"
import { createListParams, createListSchema } from "~/server/shared/list"
import { idSchema } from "~/server/shared/schemas"

const categorySortFields = ["name", "label", "createdAt", "updatedAt"] as const

const categoryDefaultSort = { id: "name", desc: false } as const

export const categoryListSchema = createListSchema(categorySortFields, categoryDefaultSort).extend({
  name: z.string().default(""),
})

export type CategoryListParams = z.infer<typeof categoryListSchema>

export const categoryListParams = {
  ...createListParams<Category>(categoryDefaultSort),
  name: parseAsString.withDefault(""),
}

const categoryFieldsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  tools: z.array(z.string()).optional(),
})

export const categoryCreateSchema = categoryFieldsSchema.extend({
  id: z.string().optional(),
})

export const categoryUpdateSchema = categoryFieldsSchema.partial().extend(idSchema.shape)
