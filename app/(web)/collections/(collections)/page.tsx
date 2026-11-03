import { getTranslations } from "next-intl/server"
import { cache } from "react"
import { CollectionList } from "~/components/web/collections/collection-list"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { getNamespacePageData, getPageMetadata } from "~/lib/pages"

// Blocking route: data is awaited in the body so HTML ships in-order with no skeleton shell.
export const instant = false

const getData = cache(async () => {
  const t = await getTranslations("navigation")
  const url = "/collections"

  return getNamespacePageData("collections", url, {
    breadcrumbs: [{ url, title: t("collections") }],
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
        <IntroDescription className="max-w-3xl">{metadata.description}</IntroDescription>
      </Intro>

      <CollectionList />

      <StructuredData data={structuredData} />
    </>
  )
}
