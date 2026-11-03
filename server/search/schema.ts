import { z } from "zod"

export const searchItemsSchema = z.object({
  query: z.string().max(100),
})

export const searchToolsSchema = z.object({
  query: z.string().trim().max(100).default(""),
  category: z.string().optional(),
  limit: z.number().int().min(1).max(25).default(10),
  page: z.number().int().min(1).max(10).default(1),
})

export const searchToolBySlugSchema = z.object({
  slug: z.string().min(1),
})
