import { getPageCount, getPagination, isTruthy } from "@dirstack/utils"
import type { Prisma } from "~/.generated/prisma/client"
import { createdAtRange, toOrderBy } from "~/server/shared/pagination"
import type { UserListParams } from "~/server/users/schema"
import { db } from "~/services/db"

export async function findUsers(search: UserListParams) {
  const { name, page, perPage, sort, from, to } = search

  const expressions: (Prisma.UserWhereInput | undefined)[] = [
    name
      ? {
          OR: [
            { name: { contains: name, mode: "insensitive" } },
            { email: { contains: name, mode: "insensitive" } },
          ],
        }
      : undefined,
    createdAtRange(from, to),
  ]

  const where: Prisma.UserWhereInput = {
    AND: expressions.filter(isTruthy),
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: toOrderBy(sort),
      ...getPagination({ page, perPage }),
    }),

    db.user.count({
      where,
    }),
  ])

  return { users, total, pageCount: getPageCount(total, perPage) }
}

export async function findUserById(id: string) {
  return db.user.findUnique({
    where: { id },
  })
}

/**
 * The oldest admin account that isn't banned.
 */
export async function findFirstAdmin() {
  return db.user.findFirst({
    where: { role: "admin", OR: [{ banned: false }, { banned: null }] },
    orderBy: { createdAt: "asc" },
  })
}

/**
 * Dropdown list of admins for the post author selector.
 */
export async function findUserList() {
  return db.user.findMany({
    where: { role: "admin" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}
