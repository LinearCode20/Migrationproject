import { getTranslations } from "next-intl/server"
import { cache } from "react"
import { CategoryQuery } from "~/components/web/categories/category-query"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroTitle } from "~/components/web/ui/intro"
import { getNamespacePageData, getPageMetadata } from "~/lib/pages"

// Blocking route: data is awaited in the body so HTML ships in-order with no skeleton shell.
export const instant = false

const getData = cache(async () => {
  const t = await getTranslations("navigation")
  const url = "/categories"

  return getNamespacePageData("categories", url, {
    breadcrumbs: [{ url, title: t("categories") }],
    pageType: "CollectionPage",
  })
})

export async function generateMetadata() {
  return getPageMetadata(await getData())
}

export default async function () {
  const { metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
      </Intro>

      <CategoryQuery />

      <StructuredData data={structuredData} />
    </>
  )
}
