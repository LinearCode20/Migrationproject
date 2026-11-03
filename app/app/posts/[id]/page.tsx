import type { Metadata } from "next"
import { cache } from "react"
import { PostForm } from "~/components/app/posts/post-form"
import { Wrapper } from "~/components/common/wrapper"
import { orNotFound, rsc } from "~/lib/orpc-server"

// See the `instant` note in app/app/layout.tsx.
export const instant = false

const getPost = cache(async (id: string) => {
  const api = await rsc()
  return orNotFound(api.posts.byId({ id }))
})

export async function generateMetadata({
  params,
}: PageProps<"/app/posts/[id]">): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id)
  return { title: `Update ${post.title}` }
}

export default async function ({ params }: PageProps<"/app/posts/[id]">) {
  const { id } = await params
  const post = await getPost(id)

  return (
    <Wrapper size="md" gap="sm">
      <PostForm title={`Update ${post.title}`} post={post} />
    </Wrapper>
  )
}
