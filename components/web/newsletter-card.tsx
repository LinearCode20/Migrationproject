import { formatNumber } from "@dirstack/utils"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { Card, CardDescription } from "~/components/common/card"
import { H5 } from "~/components/common/heading"
import { CTAForm } from "~/components/web/cta-form"
import { siteConfig } from "~/config/site"

interface NewsletterCardProps extends ComponentProps<typeof Card> {
  /** Placement name sent with the subscribe tracking event. */
  source: string
}

export function NewsletterCard({ source, ...props }: NewsletterCardProps) {
  const t = useTranslations("components.newsletter_card")

  return (
    <Card {...props}>
      <H5 render={<strong />}>{t("title")}</H5>

      <CardDescription className="-mt-2 line-clamp-none">
        {t("description", { count: formatNumber(siteConfig.stats.subscribers) })}
      </CardDescription>

      <CTAForm source={source} />
    </Card>
  )
}
