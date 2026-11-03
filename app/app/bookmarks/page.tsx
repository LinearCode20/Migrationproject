import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { BookmarkListing } from "~/components/app/bookmarks/bookmark-listing"
import { Wrapper } from "~/components/common/wrapper"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { Intro, IntroTitle } from "~/components/web/ui/intro"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("navigation")
  return { title: t("bookmarks") }
}

// See the `instant` note in app/app/layout.tsx.
export const instant = false

export default async function () {
  const t = await getTranslations("navigation")

  return (
    <Wrapper size="lg" gap="lg">
      <div className="flex flex-col gap-4">
        <Intro>
          <IntroTitle size="h3" render={<h1 />}>
            {t("bookmarks")}
          </IntroTitle>
        </Intro>

        <Suspense fallback={<DataTableSkeleton />}>
          <BookmarkListing />
        </Suspense>
      </div>
    </Wrapper>
  )
}
