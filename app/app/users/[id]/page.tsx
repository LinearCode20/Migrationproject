import type { Metadata } from "next"
import { cache } from "react"
import { UserForm } from "~/components/app/users/user-form"
import { Wrapper } from "~/components/common/wrapper"
import { orNotFound, rsc } from "~/lib/orpc-server"

// See the `instant` note in app/app/layout.tsx.
export const instant = false

const getUser = cache(async (id: string) => {
  const api = await rsc()
  return orNotFound(api.users.byId({ id }))
})

export async function generateMetadata({
  params,
}: PageProps<"/app/users/[id]">): Promise<Metadata> {
  const { id } = await params
  const user = await getUser(id)
  return { title: `Update ${user.name}` }
}

export default async function ({ params }: PageProps<"/app/users/[id]">) {
  const { id } = await params
  const user = await getUser(id)

  return (
    <Wrapper size="md" gap="sm">
      <UserForm title={`Update ${user.name}`} user={user} />
    </Wrapper>
  )
}
