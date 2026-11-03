import { getPageCount, getPagination, isTruthy } from "@dirstack/utils"
import type { Prisma } from "~/.generated/prisma/client"
import { paginationConfig } from "~/config/pagination"
import { publiclyListedToolFilter } from "~/config/tool-statuses"
import { ALPHABET, NON_ALPHA_LETTER } from "~/lib/parsers"
import { createdAtRange, toOrderBy } from "~/server/shared/pagination"
import { toSearchQuery } from "~/server/shared/search"
import { tagManyPayload } from "~/server/tags/payloads"
import { type TagFilterParams, type TagListParams, tagSort } from "~/server/tags/schema"
import { db } from "~/services/db"

/**
 * Admin table query: paginated/filterable, returns raw rows.
 */
export async function findTags(search: TagListParams, where?: Prisma.TagWhereInput) {
  const { name, page, perPage, sort, from, to } = search

  const expressions: (Prisma.TagWhereInput | undefined)[] = [
    name ? { name: { contains: name, mode: "insensitive" } } : undefined,
    createdAtRange(from, to),
  ]

  const whereQuery: Prisma.TagWhereInput = {
    AND: [...expressions.filter(isTruthy), ...(where ? [where] : [])],
  }

  const [tags, total] = await Promise.all([
    db.tag.findMany({
      where: whereQuery,
      orderBy: toOrderBy(sort),
      ...getPagination({ page, perPage }),
      include: { _count: { select: { tools: true } } },
    }),

    db.tag.count({
      where: whereQuery,
    }),
  ])

  return { tags, total, pageCount: getPageCount(total, perPage) }
}

export async function findTagList(args: Prisma.TagFindManyArgs = {}) {
  return db.tag.findMany({
    ...args,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}

export async function findTagById(id: string) {
  return db.tag.findUnique({
    where: { id },
    include: {
      tools: { select: { id: true } },
    },
  })
}

/**
 * Public catalog search with letter filter.
 */
export async function searchTags(search: TagFilterParams, where?: Prisma.TagWhereInput) {
  const { sort, page, letter } = search
  const query = toSearchQuery(search.q)

  const perPage = paginationConfig.tagsPerPage
  const nameFilters: Prisma.TagWhereInput[] = []

  if (query) {
    nameFilters.push({
      name: { contains: query, mode: "insensitive" },
    })
  }

  if (letter === NON_ALPHA_LETTER) {
    nameFilters.push({
      NOT: {
        OR: ALPHABET.map(char => ({ name: { startsWith: char, mode: "insensitive" } })),
      },
    })
  } else if (letter) {
    nameFilters.push({
      name: { startsWith: letter, mode: "insensitive" },
    })
  }

  const whereQuery: Prisma.TagWhereInput = {
    tools: { some: publiclyListedToolFilter },
    AND: [...nameFilters, ...(where ? [where] : [])],
  }

  const [tags, total] = await Promise.all([
    db.tag.findMany({
      orderBy: tagSort.resolve(sort) ?? [{ tools: { _count: "desc" } }, { name: "asc" }],
      where: whereQuery,
      select: tagManyPayload,
      ...getPagination({ page, perPage }),
    }),

    db.tag.count({
      where: whereQuery,
    }),
  ])

  return { tags, page, pageCount: getPageCount(total, perPage) }
}

/**
 * Public list of tags (with payload).
 */
export async function findPublicTags({ where, orderBy, ...args }: Prisma.TagFindManyArgs = {}) {
  return db.tag.findMany({
    ...args,
    orderBy: orderBy ?? { name: "asc" },
    where: { tools: { some: publiclyListedToolFilter }, ...where },
    select: tagManyPayload,
  })
}

export async function findTag({ where, ...args }: Prisma.TagFindFirstArgs = {}) {
  return db.tag.findFirst({
    ...args,
    where,
    select: tagManyPayload,
  })
}
