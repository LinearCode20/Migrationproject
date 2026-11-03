import type { Metadata } from "next"
import { ReportTable } from "~/components/app/reports/report-table"

export const metadata: Metadata = {
  title: "Reports",
}

// See the `instant` note in app/app/layout.tsx.
export const instant = false

export default function () {
  return <ReportTable />
}
