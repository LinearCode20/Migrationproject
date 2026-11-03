import type { ComponentProps } from "react"
import { cx } from "~/lib/utils"

export function Label({ className, htmlFor, ...props }: ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      htmlFor={htmlFor}
      className={cx(
        "self-start text-sm/snug font-medium text-foreground select-none [[for]]:cursor-pointer",
        "group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        "peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}
