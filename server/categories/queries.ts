import { getPageCount, getPagination, isTruthy } from "@dirstack/utils"
import type { Prisma } from "~/.generated/prisma/client"
import { publiclyListedToolFilter } from "~/config/tool-statuses"
import { categoryManyPayload, categoryOnePayload } from "~/server/categories/payloads"
import type { CategoryListParams } from "~/server/categories/schema"
import { createdAtRange, toOrderBy } from "~/server/shared/pagination"
import { db } from "~/services/db"

/**
 * Admin table query for categories. Paginated, filterable, sortable.
 */
export async function findCategories(
  search: CategoryListParams,
  where?: Prisma.CategoryWhereInput,
) {
  const { name, page, perPage, sort, from, to } = search

  const expressions: (Prisma.CategoryWhereInput | undefined)[] = [
    name ? { name: { contains: name, mode: "insensitive" } } : undefined,
    createdAtRange(from, to),
  ]

  const whereQuery: Prisma.CategoryWhereInput = {
    AND: [...expressions.filter(isTruthy), ...(where ? [where] : [])],
  }

  const [categories, total] = await Promise.all([
    db.category.findMany({
      where: whereQuery,
      orderBy: toOrderBy(sort),
      ...getPagination({ page, perPage }),
      include: { _count: { select: { tools: true } } },
    }),

    db.category.count({
      where: whereQuery,
    }),
  ])

  return { categories, total, pageCount: getPageCount(total, perPage) }
}

/**
 * Flat id+name list for admin dropdown selectors.
 */
export async function findCategoryList(args: Prisma.CategoryFindManyArgs = {}) {
  return db.category.findMany({
    ...args,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}

/**
 * Single-category admin lookup with relation ids for form editing.
 */
export async function findCategoryById(id: string) {
  return db.category.findUnique({
    where: { id },
    include: {
      tools: { select: { id: true } },
    },
  })
}

/**
 * Public catalog: categories with at least one publicly-listed tool.
 */
export async function findPublicCategories({
  where,
  orderBy,
  ...args
}: Prisma.CategoryFindManyArgs = {}) {
  return db.category.findMany({
    ...args,
    orderBy: orderBy ?? { name: "asc" },
    where: { tools: { some: publiclyListedToolFilter }, ...where },
    select: categoryManyPayload,
  })
}

/**
 * Public category by slug for the category detail page.
 */
export async function findCategory({ where, ...args }: Prisma.CategoryFindFirstArgs = {}) {
  return db.category.findFirst({
    ...args,
    where,
    select: categoryOnePayload,
  })
}

/**
 * Sitemap slugs.
 */
export async function findCategorySlugs({
  where,
  orderBy,
  ...args
}: Prisma.CategoryFindManyArgs = {}) {
  return db.category.findMany({
    ...args,
    orderBy: orderBy ?? { name: "asc" },
    where: { tools: { some: publiclyListedToolFilter }, ...where },
    select: { slug: true, updatedAt: true },
  })
}
