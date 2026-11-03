import { getTranslations } from "next-intl/server"
import { cache } from "react"
import { StructuredData } from "~/components/web/structured-data"
import { TagQuery } from "~/components/web/tags/tag-query"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroTitle } from "~/components/web/ui/intro"
import { getNamespacePageData, getPageMetadata } from "~/lib/pages"

type Props = PageProps<"/tags">

// Blocking route: data is awaited in the body so HTML ships in-order with no skeleton shell.
export const instant = false

const getData = cache(async () => {
  const t = await getTranslations("navigation")
  const url = "/tags"

  return getNamespacePageData("tags", url, {
    breadcrumbs: [{ url, title: t("tags") }],
    pageType: "CollectionPage",
  })
})

export async function generateMetadata(props: Props) {
  return getPageMetadata({ ...(await getData()), searchParams: await props.searchParams })
}

export default async function (props: Props) {
  const { metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
      </Intro>

      <TagQuery searchParams={props.searchParams} options={{ enableFilters: true }} />

      <StructuredData data={structuredData} />
    </>
  )
}
