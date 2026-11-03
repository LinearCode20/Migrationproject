import { capitalCase } from "change-case"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { cache } from "react"
import { StructuredData } from "~/components/web/structured-data"
import { ToolQuery } from "~/components/web/tools/tool-query"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroTitle } from "~/components/web/ui/intro"
import { siteConfig } from "~/config/site"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { findTag } from "~/server/tags/queries"

type Props = PageProps<"/tags/[slug]">

// Blocking route: data is awaited in the body so HTML ships in-order with no skeleton shell.
export const instant = false

const namespace = "pages.tag"

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params
  const tag = await findTag({ where: { slug } })

  if (!tag) {
    notFound()
  }

  const t = await getTranslations()
  const url = `/tags/${tag.slug}`
  const name = capitalCase(tag.name)
  const title = t(`${namespace}.title`, { name })
  const description = t(`${namespace}.description`, { name, siteName: siteConfig.name })

  const data = await getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/tags", title: t("navigation.tags") },
      { url, title: name },
    ],
    pageType: "CollectionPage",
  })

  return { tag, ...data }
})

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { url, metadata } = await getData(props)
  const robots = { index: false, follow: true }
  const searchParams = await props.searchParams

  return getPageMetadata({ url, metadata: { ...metadata, robots }, searchParams })
}

export default async function TagPage(props: Props) {
  const { tag, metadata, breadcrumbs, structuredData } = await getData(props)
  const t = await getTranslations()
  const placeholder = t(`${namespace}.search.placeholder`, { name: tag.name.toLowerCase() })

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
      </Intro>

      <ToolQuery
        searchParams={props.searchParams}
        where={{ tags: { some: { slug: tag.slug } } }}
        placeholder={placeholder}
      />

      <StructuredData data={structuredData} />
    </>
  )
}
