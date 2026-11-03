import type { Metadata } from "next"
import { PostTable } from "~/components/app/posts/post-table"

export const metadata: Metadata = {
  title: "Blog Posts",
}

// See the `instant` note in app/app/layout.tsx.
export const instant = false

export default function () {
  return <PostTable />
}
