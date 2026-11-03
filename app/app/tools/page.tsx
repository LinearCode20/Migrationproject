import type { Metadata } from "next"
import { ToolTable } from "~/components/app/tools/tool-table"

export const metadata: Metadata = {
  title: "Tools",
}

// See the `instant` note in app/app/layout.tsx.
export const instant = false

export default function () {
  return <ToolTable />
}
