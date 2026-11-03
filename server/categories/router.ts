import { createCategory, removeCategories, updateCategory } from "~/server/categories/mutations"
import { findCategories, findCategoryById, findCategoryList } from "~/server/categories/queries"
import {
  categoryCreateSchema,
  categoryListSchema,
  categoryUpdateSchema,
} from "~/server/categories/schema"
import { ensureFound } from "~/server/orpc/helpers"
import { authedProcedure } from "~/server/orpc/procedure"
import { idSchema, idsSchema, relationListSchema } from "~/server/shared/schemas"

const adminReads = authedProcedure.meta({
  permission: "categories.read",
})

const adminWrites = authedProcedure.meta({
  permission: "categories.update",
})

export const categories = {
  list: adminReads
    .meta({
      mcp: {
        name: "list_categories",
        description:
          "List categories, sorted by name. Filter by `name` and page with `page` and `perPage` (at most 100). Each category has its id, name, slug, label, description and tool count. Returns `categories`, `total` and `pageCount`.",
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
    })
    .input(categoryListSchema)
    .handler(async ({ input }) => findCategories(input)),

  lookup: adminReads.output(relationListSchema).handler(async () => findCategoryList()),

  byId: adminReads
    .input(idSchema)
    .handler(async ({ input: { id } }) => ensureFound(await findCategoryById(id), "Category")),

  create: adminWrites
    .meta({
      permission: "categories.create",
      mcp: {
        name: "create_category",
        description:
          "Create a category. `name` is required. `label` is the short name shown in navigation, and `tools` takes the ids of tools to add to it.",
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      },
    })
    .input(categoryCreateSchema)
    .handler(async ({ input }) => {
      const { tools, ...data } = input

      return createCategory({ data, toolIds: tools })
    }),

  update: adminWrites
    .meta({
      mcp: {
        name: "update_category",
        description:
          "Update a category by `id`. Send only the fields to change. `tools` replaces the category's current tools. Changing `name` also changes the slug and URL unless you pass the current `slug`.",
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      },
    })
    .input(categoryUpdateSchema)
    .handler(async ({ input }) => {
      const { id, tools, ...data } = input

      const existing = ensureFound(await findCategoryById(id), "Category")

      return updateCategory({
        id,
        data,
        nameOrSlug: data.slug || data.name,
        currentSlug: existing.slug,
        toolIds: tools,
      })
    }),

  duplicate: adminWrites.input(idSchema).handler(async ({ input: { id } }) => {
    const category = ensureFound(await findCategoryById(id), "Category")

    return createCategory({
      data: {
        name: `${category.name} (Copy)`,
        label: category.label,
        description: category.description,
      },
      toolIds: category.tools.map(tool => tool.id),
    })
  }),

  remove: adminWrites
    .meta({ permission: "categories.delete" })
    .input(idsSchema)
    .handler(async ({ input: { ids } }) => {
      await removeCategories(ids)
      return { success: true }
    }),
}
