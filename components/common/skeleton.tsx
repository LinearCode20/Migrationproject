import type { ComponentProps } from "react"
import { cx } from "~/lib/utils"

export function Skeleton({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cx("block animate-pulse rounded-md bg-foreground/10", className)}
      {...props}
    />
  )
}
