import type { Metadata } from "next"
import { ReportForm } from "~/components/app/reports/report-form"
import { Wrapper } from "~/components/common/wrapper"
import { formatReportId } from "~/config/reports"
import { orNotFound, rsc } from "~/lib/orpc-server"

// Reports have no name field, so the title uses the short id the admin shows
// elsewhere, such as in the report table. The id is the route param, so no fetch
// is needed.
function reportTitle(id: string) {
  return `Update report ${formatReportId(id)}`
}

// See the `instant` note in app/app/layout.tsx.
export const instant = false

export async function generateMetadata({
  params,
}: PageProps<"/app/reports/[id]">): Promise<Metadata> {
  const { id } = await params
  return { title: reportTitle(id) }
}

export default async function ({ params }: PageProps<"/app/reports/[id]">) {
  const { id } = await params
  const api = await rsc()
  const report = await orNotFound(api.reports.byId({ id }))

  return (
    <Wrapper size="md" gap="sm">
      <ReportForm title={reportTitle(id)} report={report} />
    </Wrapper>
  )
}
