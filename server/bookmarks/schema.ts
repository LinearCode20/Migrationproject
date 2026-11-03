import { z } from "zod"
import type { BookmarkedTool } from "~/server/bookmarks/payloads"
import { createListParams } from "~/server/shared/list"
import { toolListParams } from "~/server/tools/schema"

export const bookmarkListParams = {
  ...toolListParams,
  ...createListParams<BookmarkedTool>({ id: "createdAt", desc: true }),
}

export const bookmarkInputSchema = z.object({
  toolId: z.string().min(1),
})

export const bookmarkSetSchema = bookmarkInputSchema.extend({
  bookmarked: z.boolean(),
})
