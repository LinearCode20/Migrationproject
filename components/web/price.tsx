"use client"

import { formatCurrency, formatNumber } from "@dirstack/utils"
import { AnimatePresence, motion, MotionConfig } from "motion/react"
import { useLocale, useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import type Stripe from "stripe"
import { Badge } from "~/components/common/badge"
import { cx } from "~/lib/utils"

const MotionBadge = motion.create(Badge)

type Format = Intl.NumberFormatOptions

interface PriceProps extends ComponentProps<"div"> {
  price: number
  fullPrice?: number | null
  interval?: string
  discount?: number | null
  coupon?: Stripe.Coupon
  format?: Format
  currency?: string
}

export function Price({
  className,
  price,
  fullPrice,
  interval,
  discount,
  coupon,
  format,
  currency = "USD",
  ...props
}: PriceProps) {
  const locale = useLocale()
  const t = useTranslations("components.price")
  const maxRedemptions = coupon?.max_redemptions ?? 0
  const timesRedeemed = coupon?.times_redeemed ?? 0

  const defaultFormat: Intl.NumberFormatOptions = {
    notation: "standard",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    trailingZeroDisplay: "stripIfInteger",
  }

  const mergedFormat = { ...defaultFormat, ...format }
  const formattedPrice = formatCurrency(price, { currency, locale })
  const currencySymbol = formattedPrice.replace(/[\d\s.,]+/g, "").trim()
  const formattedNumber = formatNumber(price, { locale, ...mergedFormat })

  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", duration: 0.3, bounce: 0 }}>
      <div className={cx("relative", className)} {...props}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${price}-${interval}`}
            initial={{ opacity: 0, x: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -12, filter: "blur(4px)" }}
            className="flex items-center"
          >
            <span className="self-start mt-0.5 mr-0.5 text-sm leading-[0.75em]">
              {currencySymbol}
            </span>

            <div className="tabular-nums tracking-tight font-display font-semibold leading-[0.75em]">
              {formattedNumber}
            </div>

            <div className="flex flex-col items-start self-stretch ml-1.5">
              {!!fullPrice && fullPrice > price && (
                <div className="relative text-xs -mt-3">
                  <span className="text-muted-foreground">
                    {formatNumber(fullPrice, { locale })}
                  </span>

                  <span className="absolute -inset-x-0.5 top-1/2 h-[7.5%] -rotate-10 bg-destructive/50" />
                </div>
              )}

              {interval && (
                <div className="mt-auto text-sm leading-[0.75em] text-muted-foreground">
                  /{interval}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="popLayout" initial={false}>
          {!!discount && (
            <MotionBadge
              key={discount}
              variant="success"
              initial={{ opacity: 0, x: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -12, filter: "blur(4px)" }}
              className="absolute -top-3.5 right-0 border-current/10"
            >
              {t("off", { discount })}
              {!!maxRedemptions && (
                <span className="opacity-50">
                  {t("left", {
                    remaining: maxRedemptions - timesRedeemed,
                    max: maxRedemptions,
                    showMax: timesRedeemed > 0 ? "yes" : "no",
                  })}
                </span>
              )}
            </MotionBadge>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
