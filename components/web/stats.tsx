import { formatNumber } from "@dirstack/utils"
import { useLocale, useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { siteConfig } from "~/config/site"
import { cx } from "~/lib/utils"

export function Stats({ className, ...props }: ComponentProps<"div">) {
  const t = useTranslations("components.stats")
  const locale = useLocale()

  const stats = [
    { value: siteConfig.stats.pageviews, label: t("pageviews") },
    { value: siteConfig.stats.tools, label: t("tools") },
    { value: siteConfig.stats.subscribers, label: t("subscribers") },
  ]

  return (
    <div
      className={cx(
        "flex flex-wrap items-center justify-around gap-x-4 gap-y-8 text-center",
        className,
      )}
      {...props}
    >
      {stats.map(({ value, label }) => (
        <div key={label} className="space-y-1 basis-40 lg:basis-48">
          <div className="text-5xl font-display font-semibold">
            {formatNumber(value, { notation: "compact", locale })}
          </div>

          <p className="text-sm text-muted-foreground lg:text-base">{label}</p>
        </div>
      ))}
    </div>
  )
}
