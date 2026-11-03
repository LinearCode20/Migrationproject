import type { Prisma } from "~/.generated/prisma/client"
import { generateUniqueSlug } from "~/server/shared/slugs"
import { db } from "~/services/db"

interface CreatePostData extends Omit<Prisma.PostUncheckedCreateInput, "slug"> {
  slug?: string
}

interface CreatePostInput {
  data: CreatePostData
}

/**
 * Create a post with an auto-generated unique slug. Caller is responsible for
 * permission gating; this function performs pure data access.
 */
export async function createPost(input: CreatePostInput) {
  const { data } = input

  const slug = await generateUniqueSlug(db.post, data.slug || data.title)

  return db.post.create({ data: { ...data, slug } })
}

interface UpdatePostInput {
  id: string
  data: Partial<Prisma.PostUncheckedUpdateInput>
  nameOrSlug?: string
  currentSlug: string
}

/**
 * Partial update on a post. If `nameOrSlug` is provided, recompute the slug
 * (preserving the current value if the source would not change it).
 */
export async function updatePost(input: UpdatePostInput) {
  const { id, data, nameOrSlug, currentSlug } = input

  const slug = nameOrSlug ? await generateUniqueSlug(db.post, nameOrSlug, currentSlug) : undefined

  return db.post.update({ where: { id }, data: { ...data, slug } })
}

/**
 * Permanently removes posts, returning them so the caller can clean up their S3
 * media. The read and delete share one transaction.
 */
export async function removePosts(ids: string[]) {
  return db.$transaction(async tx => {
    const posts = await tx.post.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    })

    if (posts.length) {
      await tx.post.deleteMany({ where: { id: { in: posts.map(post => post.id) } } })
    }

    return { posts }
  })
}
