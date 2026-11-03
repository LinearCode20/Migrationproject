import type { ComponentProps } from "react"
import { cva, type VariantProps } from "~/lib/utils"

const wrapperVariants = cva({
  base: "@container flex flex-col w-full mr-auto",
  variants: {
    size: {
      md: "max-w-(--breakpoint-md)",
      lg: "max-w-(--breakpoint-lg)",
    },
    gap: {
      sm: "gap-y-fluid-sm",
      md: "gap-y-fluid-md",
      lg: "gap-y-fluid-lg",
      xl: "gap-y-fluid-xl",
    },
  },
  defaultVariants: {
    gap: "md",
  },
})

interface WrapperProps extends ComponentProps<"div">, VariantProps<typeof wrapperVariants> {}

export function Wrapper({ className, size, gap, ...props }: WrapperProps) {
  return <div className={wrapperVariants({ size, gap, className })} {...props} />
}
