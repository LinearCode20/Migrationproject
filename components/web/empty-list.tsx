import type { ComponentProps } from "react"
import { cx } from "~/lib/utils"

export function EmptyList({ className, ...props }: ComponentProps<"p">) {
  return <p className={cx("col-span-full text-muted-foreground", className)} {...props} />
}
