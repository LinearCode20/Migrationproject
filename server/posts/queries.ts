import { getPageCount, getPagination, isTruthy } from "@dirstack/utils"
import { type Prisma, PostStatus } from "~/.generated/prisma/client"
import { postManyPayload, postOnePayload } from "~/server/posts/payloads"
import type { PostListParams } from "~/server/posts/schema"
import { createdAtRange, toOrderBy } from "~/server/shared/pagination"
import { db } from "~/services/db"

const postAuthorInclude = {
  author: { select: { id: true, name: true } },
} satisfies Prisma.PostInclude

/**
 * Admin table query: paginated, filterable, status-aware.
 */
export async function findPosts(search: PostListParams, where?: Prisma.PostWhereInput) {
  const { title, page, perPage, sort, from, to, status } = search

  const expressions: (Prisma.PostWhereInput | undefined)[] = [
    title ? { title: { contains: title, mode: "insensitive" } } : undefined,
    createdAtRange(from, to),
    status.length > 0 ? { status: { in: status } } : undefined,
  ]

  const whereQuery: Prisma.PostWhereInput = {
    AND: [...expressions.filter(isTruthy), ...(where ? [where] : [])],
  }

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where: whereQuery,
      orderBy: toOrderBy(sort),
      ...getPagination({ page, perPage }),
      include: postAuthorInclude,
    }),

    db.post.count({
      where: whereQuery,
    }),
  ])

  return { posts, total, pageCount: getPageCount(total, perPage) }
}

export async function findPostById(id: string) {
  return db.post.findUnique({
    where: { id },
    include: postAuthorInclude,
  })
}

/**
 * Public posts list: payload-shaped, only Published posts.
 */
export async function findPublicPosts({ where, orderBy, ...args }: Prisma.PostFindManyArgs = {}) {
  return db.post.findMany({
    ...args,
    where: { status: PostStatus.Published, ...where },
    select: postManyPayload,
    orderBy: orderBy ?? { publishedAt: "desc" },
  })
}

export async function findPostSlugs({ where, orderBy, ...args }: Prisma.PostFindManyArgs = {}) {
  return db.post.findMany({
    ...args,
    where: { status: PostStatus.Published, ...where },
    select: { slug: true, updatedAt: true },
    orderBy: orderBy ?? { publishedAt: "desc" },
  })
}

export async function findPost({ where, ...args }: Prisma.PostFindFirstArgs = {}) {
  return db.post.findFirst({
    ...args,
    where,
    select: postOnePayload,
  })
}
