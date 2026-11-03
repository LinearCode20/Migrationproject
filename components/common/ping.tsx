import type { ComponentProps } from "react"
import { cx } from "~/lib/utils"

export function Ping({ className, ...props }: ComponentProps<"div">) {
  return (
    // A status dot sits beside the text that names the status, so screen readers skip it.
    <div aria-hidden className={cx("relative size-3 text-primary", className)} {...props}>
      <div className="absolute inset-0 animate-ping rounded-full bg-current opacity-30 pointer-events-none blur-[1px]" />
      <div className="absolute inset-0 animate-pulse rounded-full bg-current opacity-30 pointer-events-none" />
      <div className="absolute inset-0.75 rounded-full bg-current" />
    </div>
  )
}
