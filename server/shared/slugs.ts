import { slugify } from "@dirstack/utils"

/**
 * Any Prisma delegate for a model with a `slug @unique` column.
 */
interface SlugDelegate {
  findUnique: (args: { where: { slug: string }; select: { slug: true } }) => PromiseLike<unknown>
}

const MAX_SUFFIX = 20

/**
 * Generate a slug from `source` that is unique within the delegate's table,
 * appending `-2`, `-3`, ... on collision. Returns `currentSlug` unchanged when
 * the source would produce it again.
 */
export async function generateUniqueSlug(
  delegate: SlugDelegate,
  source: string,
  currentSlug?: string,
) {
  const baseSlug = slugify(source)

  async function isSlugTaken(slug: string) {
    return Boolean(await delegate.findUnique({ where: { slug }, select: { slug: true } }))
  }

  if (currentSlug === baseSlug || !(await isSlugTaken(baseSlug))) {
    return baseSlug
  }

  for (let suffix = 2; suffix <= MAX_SUFFIX; suffix++) {
    const candidate = `${baseSlug}-${suffix}`

    if (!(await isSlugTaken(candidate))) {
      return candidate
    }
  }

  throw new Error(`Failed to generate unique slug for "${source}".`)
}
