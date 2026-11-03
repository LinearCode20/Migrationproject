import type { ComponentProps } from "react"
import { boxVariants } from "~/components/common/box"
import { cva, cx, type VariantProps } from "~/lib/utils"

export const inputVariants = cva({
  extend: boxVariants,
  base: "appearance-none min-h-0 w-full self-stretch bg-background text-foreground text-[0.8125rem]/tight break-words transition duration-150 disabled:text-secondary-foreground/50 aria-invalid:border-destructive-text",

  variants: {
    size: {
      sm: "px-2 py-1 font-normal rounded-md",
      md: "px-3 py-2 rounded-md",
      lg: "px-4 py-2.5 rounded-lg sm:text-sm",
    },
  },

  defaultVariants: {
    size: "md",
  },
})

interface InputProps
  extends Omit<ComponentProps<"input">, "size">, VariantProps<typeof inputVariants> {}

export function Input({ className, interactive, size, ...props }: InputProps) {
  return <input className={cx(inputVariants({ interactive, size }), className)} {...props} />
}
