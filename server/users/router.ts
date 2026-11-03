import { after } from "next/server"
import { removeS3Directories } from "~/lib/media"
import { ensureFound } from "~/server/orpc/helpers"
import { authedProcedure } from "~/server/orpc/procedure"
import { idSchema, idsSchema, relationListSchema } from "~/server/shared/schemas"
import { removeUsers, updateUser } from "~/server/users/mutations"
import { findUserById, findUserList, findUsers } from "~/server/users/queries"
import { userListSchema, userRoleUpdateSchema, userUpdateSchema } from "~/server/users/schema"

const adminReads = authedProcedure.meta({
  permission: "users.read",
})

const adminWrites = authedProcedure.meta({
  permission: "users.update",
})

export const users = {
  list: adminReads.input(userListSchema).handler(async ({ input }) => findUsers(input)),

  lookup: adminReads.output(relationListSchema).handler(async () => findUserList()),

  byId: adminReads
    .input(idSchema)
    .handler(async ({ input: { id } }) => ensureFound(await findUserById(id), "User")),

  update: adminWrites.input(userUpdateSchema).handler(async ({ input: { id, ...data } }) => {
    ensureFound(await findUserById(id), "User")
    return updateUser(id, data)
  }),

  updateRole: adminWrites.input(userRoleUpdateSchema).handler(async ({ input: { id, role } }) => {
    ensureFound(await findUserById(id), "User")
    return updateUser(id, { role })
  }),

  remove: adminWrites
    .meta({ permission: "users.delete" })
    .input(idsSchema)
    .handler(async ({ input: { ids } }) => {
      const { users } = await removeUsers(ids)

      after(async () => {
        if (users.length) {
          await removeS3Directories(users.map(user => `users/${user.id}`))
        }
      })

      return { success: true }
    }),
}
