import type { Metadata } from "next"
import { TagForm } from "~/components/app/tags/tag-form"
import { Wrapper } from "~/components/common/wrapper"

export const metadata: Metadata = {
  title: "Create tag",
}

// See the `instant` note in app/app/layout.tsx.
export const instant = false

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <TagForm title="Create tag" />
    </Wrapper>
  )
}
