import type { Metadata } from "next"
import { ToolForm } from "~/components/app/tools/tool-form"
import { Wrapper } from "~/components/common/wrapper"

export const metadata: Metadata = {
  title: "Create tool",
}

// See the `instant` note in app/app/layout.tsx.
export const instant = false

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <ToolForm title="Create tool" />
    </Wrapper>
  )
}
