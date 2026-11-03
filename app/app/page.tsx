import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { DashboardOverview } from "~/components/app/dashboard/dashboard-overview"
import { DashboardToolListing } from "~/components/app/dashboard/dashboard-tool-listing"
import { Wrapper } from "~/components/common/wrapper"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { Intro, IntroTitle } from "~/components/web/ui/intro"
import { requireUser } from "~/lib/auth-guard"
import { can } from "~/server/orpc/permissions"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.dashboard")
  return { title: t("title") }
}

// See the `instant` note in app/app/layout.tsx.
export const instant = false

export default async function () {
  const user = await requireUser()
  const t = await getTranslations("pages.dashboard")

  return (
    <Wrapper size="lg" gap="lg">
      <div className="flex flex-col gap-4">
        <Intro>
          <IntroTitle size="h3" render={<h1 />}>
            {t("title")}
          </IntroTitle>
        </Intro>

        {can(user, "metrics.read") ? (
          <DashboardOverview />
        ) : (
          <Suspense fallback={<DataTableSkeleton />}>
            <DashboardToolListing />
          </Suspense>
        )}
      </div>
    </Wrapper>
  )
}
