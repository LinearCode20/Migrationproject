import { BadgeCheckIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { Tooltip } from "~/components/common/tooltip"
import { cva, cx, type VariantProps } from "~/lib/utils"

const verifiedBadgeVariants = cva({
  base: "relative z-10 -mx-1 shrink-0 stroke-background",

  variants: {
    variant: {
      default: "fill-blue-500",
      gold: "fill-yellow-500",
    },
    size: {
      sm: "mb-[-0.15em] size-4",
      md: "mb-[-0.2em] size-5",
      lg: "mb-[-0.25em] size-6",
    },
  },

  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

interface VerifiedBadgeProps
  extends
    Omit<ComponentProps<typeof BadgeCheckIcon>, "size">,
    VariantProps<typeof verifiedBadgeVariants> {}

export function VerifiedBadge({ className, size, variant, ...props }: VerifiedBadgeProps) {
  const t = useTranslations("common")
  const label = variant === "gold" ? t("gold_verified") : t("verified")

  return (
    <Tooltip tooltip={label}>
      <BadgeCheckIcon
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- an inline SVG icon has no semantic tag
        role="img"
        aria-label={label}
        className={cx(verifiedBadgeVariants({ variant, size }), className)}
        {...props}
      />
    </Tooltip>
  )
}
