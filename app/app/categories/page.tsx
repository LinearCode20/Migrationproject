import type { Metadata } from "next"
import { CategoryTable } from "~/components/app/categories/category-table"

export const metadata: Metadata = {
  title: "Categories",
}

// See the `instant` note in app/app/layout.tsx.
export const instant = false

export default function () {
  return <CategoryTable />
}
