import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { cache } from "react"
import { ToolTier } from "~/.generated/prisma/browser"
import { QueueNote } from "~/app/(web)/submit/[slug]/queue-note"
import { Note } from "~/components/common/note"
import { ProductQuery } from "~/components/web/products/product-query"
import { Stats } from "~/components/web/stats"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { siteConfig } from "~/config/site"
import { listingIntervals, ProductIntervalProvider } from "~/contexts/product-interval-context"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { getQueueMonths, type ProductFeature } from "~/lib/products"
import { getToolReviewHours, hasToolTierCap, isToolTier, isToolTierUpgrade } from "~/lib/tools"
import { countSubmittedTools, findTool } from "~/server/tools/queries"

type Props = PageProps<"/submit/[slug]">

// Per-tool checkout flow: reads the live tool + Stripe products, so it blocks on
// the request rather than streaming a shell.
export const instant = false

const namespace = "pages.submit"

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params

  const tool = await findTool({ where: { slug } })

  if (!tool) {
    notFound()
  }

  const t = await getTranslations()
  const name = tool.name
  const url = `/submit/${tool.slug}`
  const title = t(`${namespace}.upgrade.title`, { name })
  const description = t(`${namespace}.upgrade.description`, { name, siteName: siteConfig.name })

  const data = await getPageData(url, title, description)

  return { tool, ...data }
})

export async function generateMetadata(props: Props) {
  const { url, metadata } = await getData(props)
  return getPageMetadata({ url, metadata: { ...metadata, robots: { index: false } } })
}

export default async function (props: Props) {
  const { tool, url, metadata } = await getData(props)
  const { cancelled } = await props.searchParams
  const t = await getTranslations()
  const queueMonths = getQueueMonths(await countSubmittedTools())

  // How fast each tier goes live and the link it gives, generated so every card states them.
  function getTierFeatures(tier: ToolTier): ProductFeature[] {
    const speed: ProductFeature =
      tier === ToolTier.Free
        ? { name: t(`${namespace}.features.free_speed`, { months: queueMonths }), type: "neutral" }
        : {
            name: t(`${namespace}.features.paid_speed`, { hours: getToolReviewHours({ tier }) }),
            type: "positive",
          }

    const link: ProductFeature = hasToolTierCap({ tier }, "doFollow")
      ? { name: t(`${namespace}.features.dofollow`), type: "positive" }
      : { name: t(`${namespace}.features.no_dofollow`), type: "negative" }

    return [speed, link]
  }

  return (
    <>
      <Intro alignment="center">
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
        <QueueNote tool={tool} className="mt-2" />
        {cancelled === "true" && <Note>{t(`${namespace}.cancelled`)}</Note>}
      </Intro>

      <ProductIntervalProvider intervals={listingIntervals}>
        <ProductQuery
          searchParams={props.searchParams}
          checkoutData={{ toolId: tool.id, successUrl: `${url}/success` }}
          getProductProps={({ product }) => {
            const { tier } = product.metadata

            // Products without a known tier are not listings.
            if (!isToolTier(tier)) {
              return null
            }

            const name = product.name.replace(" Listing", "")
            const isDisabled = !isToolTierUpgrade(tool, tier)
            const buttonLabel =
              tier === tool.tier
                ? t(`${namespace}.current_tier`, { name })
                : (product.metadata.label ?? t(`${namespace}.choose_tier`, { name }))

            return { product: { name }, features: getTierFeatures(tier), isDisabled, buttonLabel }
          }}
          redirectToIfEmpty={`${url}/success`}
        />
      </ProductIntervalProvider>

      <Stats className="my-4" />
    </>
  )
}
