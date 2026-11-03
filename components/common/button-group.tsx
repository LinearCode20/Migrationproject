import type { ComponentProps } from "react"
import { cx } from "~/lib/utils"

type ButtonGroupProps = ComponentProps<"div">

export function ButtonGroup({ className, ...props }: ButtonGroupProps) {
  return (
    <div
      className={cx(
        "flex items-center *:rounded-none *:focus-within:z-10 *:first-of-type:rounded-l-md *:last-of-type:rounded-r-md *:not-first-of-type:-ml-px",
        className,
      )}
      {...props}
    />
  )
}
