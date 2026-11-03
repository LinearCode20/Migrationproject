import type { Metadata } from "next"
import { cache } from "react"
import { TagForm } from "~/components/app/tags/tag-form"
import { Wrapper } from "~/components/common/wrapper"
import { orNotFound, rsc } from "~/lib/orpc-server"

// See the `instant` note in app/app/layout.tsx.
export const instant = false

const getTag = cache(async (id: string) => {
  const api = await rsc()
  return orNotFound(api.tags.byId({ id }))
})

export async function generateMetadata({ params }: PageProps<"/app/tags/[id]">): Promise<Metadata> {
  const { id } = await params
  const tag = await getTag(id)
  return { title: `Update ${tag.name}` }
}

export default async function ({ params }: PageProps<"/app/tags/[id]">) {
  const { id } = await params
  const tag = await getTag(id)

  return (
    <Wrapper size="md" gap="sm">
      <TagForm title={`Update ${tag.name}`} tag={tag} />
    </Wrapper>
  )
}
