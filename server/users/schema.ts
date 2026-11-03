import { parseAsString } from "nuqs/server"
import { z } from "zod"
import type { User } from "~/.generated/prisma/browser"
import { createListParams, createListSchema } from "~/server/shared/list"
import { idSchema } from "~/server/shared/schemas"

export const userRoles = ["admin", "user"] as const

export const userRoleSchema = z.enum(userRoles)

const userSortFields = ["name", "email", "role", "createdAt", "updatedAt"] as const

const userDefaultSort = { id: "createdAt", desc: true } as const

export const userListSchema = createListSchema(userSortFields, userDefaultSort, 50).extend({
  name: z.string().default(""),
})

export type UserListParams = z.infer<typeof userListSchema>

export const userListParams = {
  ...createListParams<User>(userDefaultSort, 50),
  name: parseAsString.withDefault(""),
}

const userFieldsSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional().or(z.literal("")),
  image: z.url().optional().or(z.literal("")),
  role: userRoleSchema.optional(),
})

export const userUpdateSchema = userFieldsSchema.extend(idSchema.shape)

export const userRoleUpdateSchema = z.object({
  ...idSchema.shape,
  role: userRoleSchema,
})
