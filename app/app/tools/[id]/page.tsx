import type { Metadata } from "next"
import { cache } from "react"
import { ToolForm } from "~/components/app/tools/tool-form"
import { Wrapper } from "~/components/common/wrapper"
import { orNotFound, rsc } from "~/lib/orpc-server"

// See the `instant` note in app/app/layout.tsx.
export const instant = false

const getTool = cache(async (id: string) => {
  const api = await rsc()
  return orNotFound(api.tools.byId({ id }))
})

export async function generateMetadata({
  params,
}: PageProps<"/app/tools/[id]">): Promise<Metadata> {
  const { id } = await params
  const tool = await getTool(id)
  return { title: `Update ${tool.name}` }
}

export default async function ({ params }: PageProps<"/app/tools/[id]">) {
  const { id } = await params
  const tool = await getTool(id)

  return (
    <Wrapper size="md" gap="sm">
      <ToolForm title={`Update ${tool.name}`} tool={tool} />
    </Wrapper>
  )
}
