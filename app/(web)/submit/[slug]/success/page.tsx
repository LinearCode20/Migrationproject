import { ArrowUpRightIcon, LayoutDashboardIcon, SparklesIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cache } from "react"
import { ToolTier } from "~/.generated/prisma/browser"
import { QueueNote } from "~/app/(web)/submit/[slug]/queue-note"
import { Button } from "~/components/common/button"
import { Stack } from "~/components/common/stack"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { siteConfig } from "~/config/site"
import { tiersConfig } from "~/config/tiers"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { getToolReviewHours, isToolPublished } from "~/lib/tools"
import { findListingCheckout } from "~/server/products/queries"
import type { ToolOne } from "~/server/tools/payloads"
import { findTool } from "~/server/tools/queries"
import { isStripeEnabled } from "~/services/stripe"

type Props = PageProps<"/submit/[slug]/success">

type Checkout = Awaited<ReturnType<typeof findListingCheckout>>

// Post-checkout confirmation for one submission. Nothing to prerender, so it blocks.
export const instant = false

const namespace = "pages.submit.success"

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params

  const tool = await findTool({ where: { slug } })

  if (!tool) {
    notFound()
  }

  const t = await getTranslations()
  const name = tool.name
  const url = `/submit/${tool.slug}/success`
  const title = t(`${namespace}.title`, { name })
  const description = t(`${namespace}.description`, { name, siteName: siteConfig.name })

  const data = await getPageData(url, title, description)

  return { tool, ...data }
})

/**
 * The confirmation copy for how the visitor got here: a paid checkout, a free listing still
 * in the queue, or neither.
 */
async function getConfirmation(tool: ToolOne, checkout: Checkout) {
  const t = await getTranslations(namespace)
  const values = { name: tool.name, siteName: siteConfig.name }

  if (checkout) {
    const tier = tiersConfig[checkout.tier].label
    const title = t("paid_title", values)

    if (!checkout.isPaid) {
      return { title, description: t("paid_processing", { ...values, tier }) }
    }

    if (isToolPublished(tool)) {
      return { title, description: t("paid_live", { ...values, tier }) }
    }

    const hours = getToolReviewHours({ tier: checkout.tier })

    return { title, description: t("paid_review", { ...values, hours }) }
  }

  if (tool.tier === ToolTier.Free && !isToolPublished(tool)) {
    return { title: t("title", values), description: t("free", values), isQueued: true }
  }

  return { title: t("title", values), description: t("description", values) }
}

export async function generateMetadata(props: Props) {
  const { url, metadata } = await getData(props)
  return getPageMetadata({ url, metadata: { ...metadata, robots: { index: false } } })
}

export default async function (props: Props) {
  const { tool } = await getData(props)
  const { sessionId } = await props.searchParams
  const t = await getTranslations(namespace)

  const checkout =
    typeof sessionId === "string" ? await findListingCheckout(sessionId, tool) : undefined

  const { title, description, isQueued } = await getConfirmation(tool, checkout)

  return (
    <Intro alignment="center">
      <IntroTitle>{title}</IntroTitle>
      <IntroDescription>{description}</IntroDescription>
      {isQueued && <QueueNote tool={tool} className="mt-2" />}

      <Stack className="mt-4 justify-center">
        {/* Without Stripe there is no paid tier to upgrade to. */}
        {isQueued && isStripeEnabled && (
          <Button
            variant="fancy"
            prefix={<SparklesIcon />}
            render={<Link href={`/submit/${tool.slug}`} />}
          >
            {t("upgrade_button")}
          </Button>
        )}

        <Button variant="secondary" prefix={<LayoutDashboardIcon />} render={<Link href="/app" />}>
          {t("dashboard_button")}
        </Button>

        <Button
          variant="secondary"
          suffix={<ArrowUpRightIcon />}
          render={<Link href={`/${tool.slug}`} />}
        >
          {t("listing_button")}
        </Button>
      </Stack>
    </Intro>
  )
}
