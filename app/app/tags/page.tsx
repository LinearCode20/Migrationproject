import type { Metadata } from "next"
import { TagTable } from "~/components/app/tags/tag-table"

export const metadata: Metadata = {
  title: "Tags",
}

// See the `instant` note in app/app/layout.tsx.
export const instant = false

export default function () {
  return <TagTable />
}
