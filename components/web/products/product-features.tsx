import { CheckIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { Ping } from "~/components/common/ping"
import { Stack } from "~/components/common/stack"
import { Tooltip } from "~/components/common/tooltip"
import type { ProductFeature } from "~/lib/products"
import { cva, cx } from "~/lib/utils"

const featureVariants = cva({
  base: "flex gap-3 text-sm",

  slots: {
    icon: "shrink-0 size-5 stroke-[3px] p-1 rounded-md",
  },

  variants: {
    type: {
      positive: { base: "", icon: "bg-primary/75 text-primary-foreground" },
      neutral: { base: "", icon: "bg-foreground/10" },
      negative: { base: "text-muted-foreground", icon: "bg-foreground/10" },
    },
  },
})

interface ProductFeaturesProps extends ComponentProps<typeof Stack> {
  features: ProductFeature[]
}

export function ProductFeatures({ features, className, ...props }: ProductFeaturesProps) {
  const t = useTranslations("components.product")

  if (!features.length) {
    return null
  }

  return (
    <Stack direction="column" className={cx("my-auto flex-1 items-stretch", className)} {...props}>
      {features.map(({ type, name, footnote }, index) => {
        const Icon = type === "negative" ? XIcon : CheckIcon
        const { base, icon } = featureVariants({ type })

        return (
          <div key={index} className={base()}>
            <Icon className={icon()} />

            {name}

            {footnote && (
              <Tooltip tooltip={footnote} delay={0}>
                <button
                  type="button"
                  aria-label={t("footnote_label")}
                  className="-ml-1 mt-1 h-fit rounded-full"
                >
                  <Ping />
                </button>
              </Tooltip>
            )}
          </div>
        )
      })}
    </Stack>
  )
}
