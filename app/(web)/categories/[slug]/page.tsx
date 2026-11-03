import { lcFirst } from "@dirstack/utils"
import { noCase } from "change-case"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { cache } from "react"
import { StructuredData } from "~/components/web/structured-data"
import { ToolQuery } from "~/components/web/tools/tool-query"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { siteConfig } from "~/config/site"
import { getCategoryOpenGraphImage, getCategoryTitle } from "~/lib/opengraph"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { findCategory } from "~/server/categories/queries"

type Props = PageProps<"/categories/[slug]">

// Blocking route: data is awaited in the body so HTML ships in-order with no skeleton shell.
export const instant = false

const namespace = "pages.category"

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params
  const category = await findCategory({ where: { slug } })

  if (!category) {
    notFound()
  }

  const t = await getTranslations()
  const url = `/categories/${slug}`
  const title = await getCategoryTitle(category)
  const name = lcFirst(category.description ?? noCase(title))
  const description = t(`${namespace}.description`, { name, siteName: siteConfig.name })

  const data = await getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/categories", title: t("navigation.categories") },
      { url, title: category.name },
    ],
    pageType: "CollectionPage",
  })

  return { category, ...data }
})

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { category, url, metadata } = await getData(props)

  // A category with no public tools is left out of the sitemap, and out of the index too.
  const robots = category._count.tools ? undefined : { index: false }
  const openGraph = { images: await getCategoryOpenGraphImage(category) }
  const searchParams = await props.searchParams

  return getPageMetadata({ url, metadata: { ...metadata, openGraph, robots }, searchParams })
}

export default async function CategoryPage(props: Props) {
  const { category, metadata, breadcrumbs, structuredData } = await getData(props)
  const t = await getTranslations()
  const placeholder = t(`${namespace}.search.placeholder`, { name: metadata.title.toLowerCase() })

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription className="max-w-3xl">{metadata.description}</IntroDescription>
      </Intro>

      <ToolQuery
        searchParams={props.searchParams}
        where={{ categories: { some: { slug: category.slug } } }}
        placeholder={placeholder}
      />

      <StructuredData data={structuredData} />
    </>
  )
}
