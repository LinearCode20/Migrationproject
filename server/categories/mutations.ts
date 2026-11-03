import type { Prisma } from "~/.generated/prisma/client"
import { generateUniqueSlug } from "~/server/shared/slugs"
import { db } from "~/services/db"

interface CreateCategoryData extends Omit<Prisma.CategoryUncheckedCreateInput, "slug"> {
  slug?: string
}

interface CreateCategoryInput {
  data: CreateCategoryData
  toolIds?: string[]
}

/**
 * Create a category with an auto-generated unique slug. Caller is responsible
 * for permission gating; this function performs pure data access.
 */
export async function createCategory(input: CreateCategoryInput) {
  const { data, toolIds } = input

  const slug = await generateUniqueSlug(db.category, data.slug || data.name)

  return db.category.create({
    data: {
      ...data,
      slug,
      tools: toolIds ? { connect: toolIds.map(id => ({ id })) } : undefined,
    },
  })
}

interface UpdateCategoryInput {
  id: string
  data: Partial<Prisma.CategoryUncheckedUpdateInput>
  nameOrSlug?: string
  currentSlug: string
  toolIds?: string[]
}

/**
 * Partial update on a category. If `nameOrSlug` is provided, recompute the slug
 * (preserving the current value if the source would not change it).
 */
export async function updateCategory(input: UpdateCategoryInput) {
  const { id, data, nameOrSlug, currentSlug, toolIds } = input

  const slug = nameOrSlug
    ? await generateUniqueSlug(db.category, nameOrSlug, currentSlug)
    : undefined

  return db.category.update({
    where: { id },
    data: {
      ...data,
      slug,
      tools: toolIds && { set: toolIds.map(id => ({ id })) },
    },
  })
}

/**
 * Hard-delete categories by id.
 */
export async function removeCategories(ids: string[]) {
  return db.category.deleteMany({ where: { id: { in: ids } } })
}
