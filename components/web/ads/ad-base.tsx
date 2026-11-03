"use client"

import { removeQueryParams, setQueryParams } from "@dirstack/utils"
import { useTracking } from "@revinel/react"
import type { RevinelAd } from "@revinel/sdk"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ComponentProps, CSSProperties } from "react"
import { Badge } from "~/components/common/badge"
import { boxVariants } from "~/components/common/box"
import { Card } from "~/components/common/card"
import { ExternalLink, type ExternalLinkBaseProps } from "~/components/web/external-link"
import { siteConfig } from "~/config/site"
import { cx } from "~/lib/utils"

interface AdLinkProps extends ExternalLinkBaseProps {
  ad: RevinelAd
  source?: string
  params?: Record<string, string | number | boolean>
}

export function AdLink({ ref, ad, source, params, onClick, onAuxClick, ...props }: AdLinkProps) {
  const url = removeQueryParams(ad.websiteUrl)
  const isInternal = url.startsWith(siteConfig.url)

  // The pathname is the resetKey, so a client-side navigation re-arms tracking for the new placement.
  const resetKey = usePathname()
  const { impressionRef, getClickProps } = useTracking(ad, { resetKey, ref })

  return (
    <ExternalLink
      ref={impressionRef}
      href={setQueryParams(ad.websiteUrl, params ?? {})}
      target={isInternal ? "_self" : "_blank"}
      eventName="click_ad"
      eventProps={{ url, source }}
      doFollow
      sponsored={!isInternal}
      doTrack
      {...props}
      {...getClickProps({ onClick, onAuxClick })}
    />
  )
}

interface AdWrapperProps extends ComponentProps<typeof Card> {
  brandColor?: string | null
}

export function AdWrapper({ className, style, brandColor, ...props }: AdWrapperProps) {
  return (
    <Card
      interactive
      style={{
        ...(brandColor &&
          ({
            "--brand": brandColor,
            "--brand-tint": "color-mix(in oklch, var(--brand) 5%, transparent)",
            "--brand-tint-hover": "color-mix(in oklch, var(--brand) 10%, transparent)",
          } as CSSProperties)),
        ...style,
      }}
      className={cx(brandColor && "bg-(--brand-tint)! hover:bg-(--brand-tint-hover)!", className)}
      {...props}
    />
  )
}

// Its own link (stays clickable over the AdLink overlay); `?ref=ad` also keeps the
// href off the `a[href="/advertise"]` selector ad-blocker cosmetic filters pivot on.
export function AdBadge({ className, ...props }: ComponentProps<typeof Badge>) {
  const t = useTranslations("ads")

  return (
    <Badge
      variant="outline"
      render={<Link href="/advertise?ref=ad" />}
      className={cx(boxVariants({ interactive: true }), "text-muted-foreground/75", className)}
      {...props}
    >
      {t("ad_label")}
    </Badge>
  )
}
