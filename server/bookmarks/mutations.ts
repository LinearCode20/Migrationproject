import { db } from "~/services/db"

/**
 * Idempotently bookmark a tool for a user. Safe to call when the bookmark
 * already exists; Prisma's upsert turns it into a no-op.
 */
export async function upsertBookmark(userId: string, toolId: string) {
  return db.bookmark.upsert({
    where: { userId_toolId: { userId, toolId } },
    update: {},
    create: { userId, toolId },
  })
}

/**
 * Remove a bookmark for a user/tool pair. `deleteMany` is used (instead of
 * the unique-key `delete`) so missing rows don't throw; the operation is
 * naturally idempotent.
 */
export async function deleteBookmark(userId: string, toolId: string) {
  return db.bookmark.deleteMany({
    where: { userId, toolId },
  })
}
