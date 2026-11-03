import { isLightColor } from "@dirstack/utils"
import { ArrowUpRightIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"
import type { ComponentProps } from "react"
import { Button } from "~/components/common/button"
import {
  Card,
  CardBadges,
  CardDescription,
  CardHeader,
  CardIcon,
  type CardProps,
} from "~/components/common/card"
import { H4 } from "~/components/common/heading"
import { Skeleton } from "~/components/common/skeleton"
import { AdBadge, AdLink, AdWrapper } from "~/components/web/ads/ad-base"
import { Favicon } from "~/components/web/ui/favicon"
import { cx } from "~/lib/utils"
import { fetchAd, takeGridAd } from "~/services/revinel"

interface AdCardProps extends CardProps {
  /** Grid slot: take the next ad from the request-scoped pool (see `takeGridAd`). */
  grid?: boolean
}

export async function AdCard({ className, grid = false, ...props }: AdCardProps) {
  const t = await getTranslations()
  const ad = grid ? await takeGridAd() : await fetchAd()

  if (!ad) {
    return null
  }

  const brandColor = ad.meta.brandColor?.hex

  return (
    <AdWrapper brandColor={brandColor} className={cx("group/button", className)} {...props}>
      <CardBadges>
        <AdBadge />
      </CardBadges>

      <CardHeader wrap={false}>
        <Favicon src={ad.faviconUrl ?? "/favicon.png"} contained />

        <H4 render={<strong />} className="truncate">
          {ad.name}
        </H4>
      </CardHeader>

      <CardDescription className="mb-auto pr-1 line-clamp-4">{ad.meta.description}</CardDescription>

      <Button
        suffix={<ArrowUpRightIcon />}
        render={<AdLink ad={ad} source="card" />}
        className={cx(
          "md:w-full",
          brandColor && "bg-(--brand)!",
          brandColor && (isLightColor(brandColor) ? "text-black!" : "text-white!"),
        )}
      >
        {ad.meta.buttonLabel || t("common.visit", { name: ad.name })}
        {/* The overlay makes the whole card clickable. The AdBadge stays a separate link. */}
        <span className="absolute -inset-px" />
      </Button>

      <CardIcon>
        <Favicon src={ad.faviconUrl ?? "/favicon.png"} />
      </CardIcon>
    </AdWrapper>
  )
}

export function AdCardSkeleton({ className, ...props }: ComponentProps<typeof Card>) {
  return (
    <Card className={cx("items-stretch select-none", className)} {...props}>
      <CardBadges>
        <AdBadge />
      </CardBadges>

      <CardHeader>
        <Favicon src="/favicon.png" contained className="animate-pulse opacity-50" />

        <H4 className="w-2/3">
          <Skeleton>&nbsp;</Skeleton>
        </H4>
      </CardHeader>

      <CardDescription className="flex flex-col gap-0.5 mb-auto">
        <Skeleton className="h-5 w-full">&nbsp;</Skeleton>
        <Skeleton className="h-5 w-2/3">&nbsp;</Skeleton>
      </CardDescription>

      <Button
        render={<span />}
        className="pointer-events-none opacity-10 text-transparent md:w-full"
      >
        &nbsp;
      </Button>
    </Card>
  )
}
