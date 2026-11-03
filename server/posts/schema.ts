import { parseAsArrayOf, parseAsString, parseAsStringEnum } from "nuqs/server"
import { z } from "zod"
import { type Post, PostStatus } from "~/.generated/prisma/browser"
import { arrayable, createListParams, createListSchema } from "~/server/shared/list"
import { idSchema } from "~/server/shared/schemas"

const postSortFields = ["title", "status", "createdAt", "updatedAt", "publishedAt"] as const

const postDefaultSort = { id: "createdAt", desc: true } as const

export const postListSchema = createListSchema(postSortFields, postDefaultSort).extend({
  title: z.string().default(""),
  status: arrayable(z.enum(PostStatus)).default([]),
})

export type PostListParams = z.infer<typeof postListSchema>

export const postListParams = {
  ...createListParams<Post>(postDefaultSort),
  title: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringEnum(Object.values(PostStatus))).withDefault([]),
}

const postFieldsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  plainText: z.string(),
  imageUrl: z.string().optional(),
  status: z.enum(PostStatus),
  publishedAt: z.coerce.date().nullish(),
  authorId: z.string().min(1, "Author is required"),
})

export const postCreateSchema = postFieldsSchema.extend({
  id: z.string().optional(),
  plainText: z.string().optional(),
  status: z.enum(PostStatus).optional(),
})

export const postUpdateSchema = postFieldsSchema.partial().extend(idSchema.shape)
