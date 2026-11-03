import { ensureFound } from "~/server/orpc/helpers"
import { authedProcedure } from "~/server/orpc/procedure"
import { idSchema, idsSchema, relationListSchema } from "~/server/shared/schemas"
import { createTag, removeTags, updateTag } from "~/server/tags/mutations"
import { findTagById, findTagList, findTags } from "~/server/tags/queries"
import { tagCreateSchema, tagListSchema, tagUpdateSchema } from "~/server/tags/schema"

const adminReads = authedProcedure.meta({
  permission: "tags.read",
})

const adminWrites = authedProcedure.meta({
  permission: "tags.update",
})

export const tags = {
  list: adminReads
    .meta({
      mcp: {
        name: "list_tags",
        description:
          "List tags, sorted by name. Filter by `name` and page with `page` and `perPage` (at most 100). Each tag has its id, name, slug and tool count. Returns `tags`, `total` and `pageCount`.",
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
    })
    .input(tagListSchema)
    .handler(async ({ input }) => findTags(input)),

  lookup: adminReads.output(relationListSchema).handler(async () => findTagList()),

  byId: adminReads
    .input(idSchema)
    .handler(async ({ input: { id } }) => ensureFound(await findTagById(id), "Tag")),

  create: adminWrites
    .meta({
      permission: "tags.create",
      mcp: {
        name: "create_tag",
        description: "Create a tag. `name` is required, and `tools` takes the ids of tools to tag.",
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      },
    })
    .input(tagCreateSchema)
    .handler(async ({ input }) => {
      const { tools, ...data } = input

      return createTag({ data, toolIds: tools })
    }),

  update: adminWrites
    .meta({
      mcp: {
        name: "update_tag",
        description:
          "Update a tag by `id`. Send only the fields to change. `tools` replaces the tag's current tools. Changing `name` also changes the slug and URL unless you pass the current `slug`.",
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      },
    })
    .input(tagUpdateSchema)
    .handler(async ({ input }) => {
      const { id, tools, ...data } = input

      const existing = ensureFound(await findTagById(id), "Tag")

      return updateTag({
        id,
        data,
        nameOrSlug: data.slug || data.name,
        currentSlug: existing.slug,
        toolIds: tools,
      })
    }),

  duplicate: adminWrites.input(idSchema).handler(async ({ input: { id } }) => {
    const tag = ensureFound(await findTagById(id), "Tag")

    return createTag({
      data: { name: `${tag.name} (Copy)` },
      toolIds: tag.tools.map(tool => tool.id),
    })
  }),

  remove: adminWrites
    .meta({ permission: "tags.delete" })
    .input(idsSchema)
    .handler(async ({ input: { ids } }) => {
      await removeTags(ids)
      return { success: true }
    }),
}
