import { TierSelector } from "@revinel/react"
import { getTranslations } from "next-intl/server"
import { cache } from "react"
import { Button } from "~/components/common/button"
import { Wrapper } from "~/components/common/wrapper"
import { ExternalLink } from "~/components/web/external-link"
import { Stats } from "~/components/web/stats"
import { StructuredData } from "~/components/web/structured-data"
import { Testimonial } from "~/components/web/testimonial"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { adsConfig } from "~/config/ads"
import { siteConfig } from "~/config/site"
import { getNamespacePageData, getPageMetadata } from "~/lib/pages"

// Blocking route: data is awaited in the body so HTML ships in-order with no skeleton shell.
export const instant = false

const getData = cache(() => getNamespacePageData("advertise", "/advertise"))

export async function generateMetadata() {
  return getPageMetadata(await getData())
}

export default async function () {
  const { metadata, structuredData } = await getData()
  const t = await getTranslations("pages.advertise.cta")

  return (
    <Wrapper gap="xl">
      <div className="flex flex-col items-center gap-10">
        <Intro alignment="center">
          <IntroTitle>{metadata.title}</IntroTitle>
          <IntroDescription>{metadata.description}</IntroDescription>
        </Intro>

        {adsConfig.enabled && <TierSelector className="w-full" />}
      </div>

      <Stats />

      <Testimonial />

      <hr />

      <Intro alignment="center">
        <IntroTitle size="h2" render={<h3 />}>
          {t("title")}
        </IntroTitle>

        <IntroDescription className="max-w-lg">{t("description")}</IntroDescription>

        <Button
          render={<ExternalLink href={`mailto:${siteConfig.email}`} />}
          className="mt-4 min-w-40"
        >
          {t("button")}
        </Button>
      </Intro>

      <StructuredData data={structuredData} />
    </Wrapper>
  )
}
