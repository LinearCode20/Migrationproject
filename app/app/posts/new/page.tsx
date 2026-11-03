import type { Metadata } from "next"
import { PostForm } from "~/components/app/posts/post-form"
import { Wrapper } from "~/components/common/wrapper"

export const metadata: Metadata = {
  title: "Create post",
}

// See the `instant` note in app/app/layout.tsx.
export const instant = false

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <PostForm title="Create post" />
    </Wrapper>
  )
}
