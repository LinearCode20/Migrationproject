import type { Prisma } from "~/.generated/prisma/client"
import { generateUniqueSlug } from "~/server/shared/slugs"
import { db } from "~/services/db"

interface CreateTagData extends Omit<Prisma.TagUncheckedCreateInput, "slug"> {
  slug?: string
}

interface CreateTagInput {
  data: CreateTagData
  toolIds?: string[]
}

/**
 * Create a tag with an auto-generated unique slug. Caller is responsible for
 * permission gating; this function performs pure data access.
 */
export async function createTag(input: CreateTagInput) {
  const { data, toolIds } = input

  const slug = await generateUniqueSlug(db.tag, data.slug || data.name)

  return db.tag.create({
    data: {
      ...data,
      slug,
      tools: toolIds ? { connect: toolIds.map(id => ({ id })) } : undefined,
    },
  })
}

interface UpdateTagInput {
  id: string
  data: Partial<Prisma.TagUncheckedUpdateInput>
  nameOrSlug?: string
  currentSlug: string
  toolIds?: string[]
}

/**
 * Partial update on a tag. If `nameOrSlug` is provided, recompute the slug
 * (preserving the current value if the source would not change it).
 */
export async function updateTag(input: UpdateTagInput) {
  const { id, data, nameOrSlug, currentSlug, toolIds } = input

  const slug = nameOrSlug ? await generateUniqueSlug(db.tag, nameOrSlug, currentSlug) : undefined

  return db.tag.update({
    where: { id },
    data: {
      ...data,
      slug,
      tools: toolIds && { set: toolIds.map(id => ({ id })) },
    },
  })
}

/**
 * Hard-delete tags by id.
 */
export async function removeTags(ids: string[]) {
  return db.tag.deleteMany({ where: { id: { in: ids } } })
}
