import type { Prisma } from "~/.generated/prisma/client"
import { toolManyPayload } from "~/server/tools/payloads"

/**
 * A user can bookmark any tool, so a bookmarked row carries only the public fields and
 * never the owner's details. `createdAt` is the table's default sort.
 */
export const bookmarkedToolPayload = {
  ...toolManyPayload,
  createdAt: true,
} satisfies Prisma.ToolSelect

export type BookmarkedTool = Prisma.ToolGetPayload<{ select: typeof bookmarkedToolPayload }>
