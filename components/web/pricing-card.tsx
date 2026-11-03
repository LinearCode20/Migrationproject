"use client"

import { useTranslations } from "next-intl"
import type { ComponentProps, ReactNode } from "react"
import { Badge } from "~/components/common/badge"
import { Card, CardBg } from "~/components/common/card"
import { H4 } from "~/components/common/heading"
import { Stack } from "~/components/common/stack"
import { cx } from "~/lib/utils"

interface PricingCardProps extends ComponentProps<typeof Card> {
  /** Plan name, rendered as the card heading. */
  name: ReactNode
  /** Short plan blurb under the heading. */
  description?: ReactNode
  /** Slot beside the heading (e.g. a billing-interval switch). */
  headerAction?: ReactNode
  /** Applies the "most popular" label and highlighted border. */
  isHighlighted?: boolean
  /** Dims the card and blocks interaction. */
  isDisabled?: boolean
}

/**
 * Presentational pricing-card shell. Holds the "most popular" label, frame, and
 * header; callers pass price/features/button as children.
 */
export function PricingCard({
  name,
  description,
  headerAction,
  isHighlighted,
  isDisabled,
  className,
  children,
  ...props
}: PricingCardProps) {
  const t = useTranslations("components.product")

  return (
    <Card
      className={cx(
        "items-stretch gap-8 basis-72 grow max-w-80",
        isHighlighted && "border-primary/50",
        isDisabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      data-highlighted={isHighlighted || undefined}
      {...props}
    >
      {isHighlighted && <CardBg className="inset-x-0 top-0 z-0" />}

      <Stack size="lg" direction="column">
        <Stack className="w-full">
          <H4 className="flex-1 truncate">{name}</H4>

          {isHighlighted && !headerAction && (
            <Badge className="bg-primary/10 text-primary">{t("most_popular")}</Badge>
          )}

          {headerAction}
        </Stack>

        {description && <p className="text-foreground/50 text-sm text-pretty">{description}</p>}
      </Stack>

      {children}
    </Card>
  )
}
