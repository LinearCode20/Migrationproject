import type { ComponentProps } from "react"
import { cva, cx, type VariantProps } from "~/lib/utils"

const eyebrowVariants = cva({
  base: "text-[0.6875rem] font-medium uppercase tracking-wider",

  variants: {
    variant: {
      muted: "text-muted-foreground/60",
      primary: "font-mono text-primary",
    },
  },

  defaultVariants: {
    variant: "muted",
  },
})

interface EyebrowProps extends ComponentProps<"p">, VariantProps<typeof eyebrowVariants> {}

export function Eyebrow({ className, variant, ...props }: EyebrowProps) {
  return <p className={cx(eyebrowVariants({ variant }), className)} {...props} />
}
