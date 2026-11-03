import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { cache } from "react"
import { StructuredData } from "~/components/web/structured-data"
import { ToolQuery } from "~/components/web/tools/tool-query"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { getCollection } from "~/config/collections"
import { siteConfig } from "~/config/site"
import { getPageData, getPageMetadata } from "~/lib/pages"

type Props = PageProps<"/collections/[slug]">

// Blocking route: data is awaited in the body so HTML ships in-order with no skeleton shell.
export const instant = false

const getData = cache(async ({ params }: Props) => {
  const collection = getCollection((await params).slug)

  if (!collection) {
    notFound()
  }

  const t = await getTranslations()
  const namespace = `pages.collections.${collection.slug}`
  const url = `/collections/${collection.slug}`
  const title = t(`${namespace}.title`)
  const description = t(`${namespace}.description`, { siteName: siteConfig.name })
  const placeholder = t(`${namespace}.search.placeholder`)

  const data = await getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/collections", title: t("navigation.collections") },
      { url, title: t(`${namespace}.name`) },
    ],
    pageType: "CollectionPage",
  })

  return { collection, placeholder, ...data }
})

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { url, metadata } = await getData(props)

  return getPageMetadata({ url, metadata, searchParams: await props.searchParams })
}

export default async function CollectionPage(props: Props) {
  const { collection, placeholder, metadata, breadcrumbs, structuredData } = await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription className="max-w-3xl">{metadata.description}</IntroDescription>
      </Intro>

      <ToolQuery
        searchParams={props.searchParams}
        where={collection.where}
        overrideParams={collection.overrideParams}
        placeholder={placeholder}
        options={collection.options}
      />

      <StructuredData data={structuredData} />
    </>
  )
}
