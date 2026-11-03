import type { Prisma } from "~/.generated/prisma/client"
import { db } from "~/services/db"

/**
 * Partial update on a user by id. Caller is responsible for permission gating;
 * this function performs pure data access.
 */
export async function updateUser(id: string, data: Prisma.UserUncheckedUpdateInput) {
  return db.user.update({ where: { id }, data })
}

/**
 * Hard-delete users by id, returning the removed rows so the caller can clean
 * up their S3 media. Admin users are protected at the data layer: they are
 * excluded from the read, so they are never deleted this way. The read and
 * delete share one transaction.
 */
export async function removeUsers(ids: string[]) {
  return db.$transaction(async tx => {
    const users = await tx.user.findMany({
      where: { id: { in: ids }, role: { not: "admin" } },
      select: { id: true },
    })

    if (users.length) {
      const userIds = users.map(user => user.id)

      // The database clears `ownerId` on delete. The tool's verification goes with its owner,
      // so another user can verify it.
      await tx.tool.updateMany({ where: { ownerId: { in: userIds } }, data: { verifiedAt: null } })
      await tx.user.deleteMany({ where: { id: { in: userIds } } })
    }

    return { users }
  })
}
