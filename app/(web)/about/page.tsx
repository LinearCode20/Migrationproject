import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { cache } from "react"
import { Prose } from "~/components/common/prose"
import { ExternalLink } from "~/components/web/external-link"
import { StructuredData } from "~/components/web/structured-data"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { siteConfig } from "~/config/site"
import { getPageOpenGraphImage } from "~/lib/opengraph"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateAboutPage } from "~/lib/structured-data"

// Blocking route: data is awaited in the body so HTML ships in-order with no skeleton shell.
export const instant = false

const getData = cache(async () => {
  const t = await getTranslations("pages.about")
  const url = "/about"
  const title = t("title")
  const description = t("description", { siteName: siteConfig.name })

  return getPageData(url, title, description, {
    metadata: { openGraph: { images: await getPageOpenGraphImage("about") } },
    breadcrumbs: [{ url, title }],
    structuredData: [generateAboutPage(url, title, description)],
  })
})

export async function generateMetadata() {
  return getPageMetadata(await getData())
}

export default async function () {
  const { metadata, structuredData } = await getData()

  return (
    <>
      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <Prose>
        <h2>What is {siteConfig.name}?</h2>

        <p>
          <Link href="/">{siteConfig.name}</Link> is a community-driven list of{" "}
          <strong>tools and resources for developers</strong>. The goal of the site is to be your
          first stop when researching for a new tool or resource to help you grow your business. It
          will help you find alternatives and reviews of the products you already use.
        </p>

        <h2>About the Author</h2>

        <p>
          I'm a software developer and entrepreneur. I've been building web applications for over 15
          years. I'm passionate about software development and I love to contribute to the community
          in any way I can.
        </p>

        <p>
          I'm always looking for new projects to work on and new people to collaborate with. Feel
          free to reach out to me if you have any questions or suggestions.
        </p>

        <p>
          <ExternalLink href={siteConfig.author.url} doFollow>
            {siteConfig.author.name}
          </ExternalLink>
        </p>
      </Prose>

      <StructuredData data={structuredData} />
    </>
  )
}
