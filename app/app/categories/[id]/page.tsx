import type { Metadata } from "next"
import { cache } from "react"
import { CategoryForm } from "~/components/app/categories/category-form"
import { Wrapper } from "~/components/common/wrapper"
import { orNotFound, rsc } from "~/lib/orpc-server"

// See the `instant` note in app/app/layout.tsx.
export const instant = false

const getCategory = cache(async (id: string) => {
  const api = await rsc()
  return orNotFound(api.categories.byId({ id }))
})

export async function generateMetadata({
  params,
}: PageProps<"/app/categories/[id]">): Promise<Metadata> {
  const { id } = await params
  const category = await getCategory(id)
  return { title: `Update ${category.name}` }
}

export default async function ({ params }: PageProps<"/app/categories/[id]">) {
  const { id } = await params
  const category = await getCategory(id)

  return (
    <Wrapper size="md" gap="sm">
      <CategoryForm title={`Update ${category.name}`} category={category} />
    </Wrapper>
  )
}
