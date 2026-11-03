import { HOUR_SECONDS } from "@dirstack/utils"
import { deleteBookmark, upsertBookmark } from "~/server/bookmarks/mutations"
import { findBookmark, findBookmarkedTools } from "~/server/bookmarks/queries"
import { bookmarkInputSchema, bookmarkSetSchema } from "~/server/bookmarks/schema"
import { authedProcedure } from "~/server/orpc/procedure"
import { toolListSchema } from "~/server/tools/schema"

const writes = authedProcedure.meta({
  permission: "bookmarks.write",
  rateLimit: { points: 60, duration: HOUR_SECONDS },
})

export const bookmarks = {
  list: authedProcedure
    .meta({ permission: "bookmarks.read" })
    .input(toolListSchema)
    .handler(async ({ input, context: { user } }) => findBookmarkedTools(user.id, input)),

  check: authedProcedure
    .meta({ permission: "bookmarks.read" })
    .input(bookmarkInputSchema)
    .handler(async ({ input: { toolId }, context: { user } }) => {
      const bookmark = await findBookmark(user.id, toolId)
      return { bookmarked: Boolean(bookmark) }
    }),

  set: writes
    .input(bookmarkSetSchema)
    .handler(async ({ input: { toolId, bookmarked }, context: { user } }) => {
      if (bookmarked) {
        await upsertBookmark(user.id, toolId)
      } else {
        await deleteBookmark(user.id, toolId)
      }

      return { bookmarked }
    }),

  remove: writes
    .input(bookmarkInputSchema)
    .handler(async ({ input: { toolId }, context: { user } }) => {
      await deleteBookmark(user.id, toolId)

      return { removed: true }
    }),
}
