import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { cache } from "react"
import { Hero } from "~/app/(web)/(home)/hero"
import { StructuredData } from "~/components/web/structured-data"
import { ToolQuery } from "~/components/web/tools/tool-query"
import { siteConfig } from "~/config/site"
import { getPageData, getPageMetadata } from "~/lib/pages"

type Props = PageProps<"/">

// Blocking route: data is awaited in the body so HTML ships in-order with no skeleton shell.
export const instant = false

const getData = cache(async () => {
  const t = await getTranslations()
  const title = `${t("brand.tagline")} – ${siteConfig.name}`
  const description = t("brand.description")

  return getPageData(siteConfig.url, title, description)
})

export async function generateMetadata(props: Props): Promise<Metadata> {
  return getPageMetadata({ url: "/", searchParams: await props.searchParams })
}

export default async function (props: Props) {
  const { structuredData } = await getData()

  return (
    <>
      <Hero />

      <ToolQuery searchParams={props.searchParams} options={{ enableFilters: true }} />

      <StructuredData data={structuredData} />
    </>
  )
}
