import { getTranslations } from "next-intl/server"
import { cache } from "react"
import { PostQuery } from "~/components/web/posts/post-query"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { getNamespacePageData, getPageMetadata } from "~/lib/pages"

// Blocking route: data is awaited in the body so HTML ships in-order with no skeleton shell.
export const instant = false

const getData = cache(async () => {
  const t = await getTranslations("navigation")
  const url = "/blog"

  return getNamespacePageData("blog", url, {
    breadcrumbs: [{ url, title: t("blog") }],
  })
})

export async function generateMetadata() {
  return getPageMetadata(await getData())
}

export default async function () {
  const { url, metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <PostQuery url={url} title={metadata.title} description={metadata.description} />

      <StructuredData data={structuredData} />
    </>
  )
}
