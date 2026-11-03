"use client"

import { useTranslations } from "next-intl"
import { Ping } from "~/components/common/ping"
import { SegmentedControl, SegmentedControlItem } from "~/components/common/segmented-control"
import { useProductInterval } from "~/contexts/product-interval-context"
import type { ProductInterval } from "~/lib/products"
import { cx } from "~/lib/utils"

interface ProductIntervalSwitchProps {
  className?: string
  /** Show a dot on the yearly tab to hint at the yearly saving. */
  showYearlyHint?: boolean
}

export function ProductIntervalSwitch({
  className,
  showYearlyHint = true,
}: ProductIntervalSwitchProps) {
  const t = useTranslations("common")
  const { intervals, interval, setInterval } = useProductInterval()

  return (
    <SegmentedControl<ProductInterval>
      value={interval}
      onValueChange={setInterval}
      className={cx("bg-foreground/5", className)}
    >
      {intervals.map(option => (
        <SegmentedControlItem key={option} value={option}>
          {t(`interval.${option}`)}

          {showYearlyHint && option === "year" && interval !== "year" && (
            <Ping className="absolute right-0 top-0 size-2.5 text-success" />
          )}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  )
}
