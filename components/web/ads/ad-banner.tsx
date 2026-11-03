import { getTranslations } from "next-intl/server"
import type { ComponentProps } from "react"
import { Button } from "~/components/common/button"
import { Card } from "~/components/common/card"
import { Skeleton } from "~/components/common/skeleton"
import { AdBadge, AdLink, AdWrapper } from "~/components/web/ads/ad-base"
import { Container } from "~/components/web/ui/container"
import { Favicon } from "~/components/web/ui/favicon"
import { cx } from "~/lib/utils"
import { fetchAd } from "~/services/revinel"

export async function AdBanner({ className, ...props }: ComponentProps<typeof Card>) {
  const t = await getTranslations("ads")

  const ad = await fetchAd({ premium: true })

  if (!ad) {
    return null
  }

  return (
    <Container className="z-49 mt-1">
      <AdWrapper
        brandColor={ad.meta.brandColor?.hex}
        className={cx("flex-row items-center gap-3 px-3 py-2.5 md:px-4", className)}
        {...props}
      >
        <AdBadge className="relative z-15 leading-none max-sm:order-last" />

        <div className="text-xs leading-tight text-secondary-foreground mr-auto sm:text-sm">
          <Favicon
            src={ad.faviconUrl}
            size={32}
            className="float-left align-middle p-0 mr-1.5 size-3.5 rounded-sm sm:size-4"
          />
          <strong className="font-medium text-foreground">{ad.name}</strong>
          {ad.meta.shortDescription && ` – ${ad.meta.shortDescription}`}
        </div>

        {/* The button is hidden on mobile, so a full-cover link takes its place. */}
        <AdLink
          ad={ad}
          source="banner"
          aria-label={ad.name}
          className="absolute inset-0 sm:hidden"
        />

        <Button
          variant="secondary"
          size="sm"
          render={<AdLink ad={ad} source="banner" />}
          className="shrink-0 leading-none max-sm:hidden"
        >
          {t("learn_more")}
          <span className="absolute -inset-px" />
        </Button>
      </AdWrapper>
    </Container>
  )
}

export async function AdBannerSkeleton({ className, ...props }: ComponentProps<typeof Card>) {
  const t = await getTranslations("ads")

  return (
    <Container className="z-49 mt-1">
      <Card
        className={cx("flex-row items-center gap-3 px-3 py-2.5 select-none md:px-4", className)}
        {...props}
      >
        <AdBadge className="leading-none max-sm:order-last opacity-50" />

        <div className="flex items-center gap-1.5 mr-auto w-full max-w-md">
          <Skeleton className="size-3.5 rounded-sm sm:size-4" />
          <Skeleton className="h-4 w-full">&nbsp;</Skeleton>
        </div>

        <Button
          variant="secondary"
          size="sm"
          render={<span />}
          className="shrink-0 leading-none pointer-events-none opacity-50 text-transparent max-sm:hidden"
        >
          {t("learn_more")}
        </Button>
      </Card>
    </Container>
  )
}
