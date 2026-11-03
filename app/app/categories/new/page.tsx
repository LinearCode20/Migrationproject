import type { Metadata } from "next"
import { CategoryForm } from "~/components/app/categories/category-form"
import { Wrapper } from "~/components/common/wrapper"

export const metadata: Metadata = {
  title: "Create category",
}

// See the `instant` note in app/app/layout.tsx.
export const instant = false

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <CategoryForm title="Create category" />
    </Wrapper>
  )
}
