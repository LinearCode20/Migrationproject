import { formatNumber } from "@dirstack/utils"
import type { ComponentProps, ReactNode } from "react"
import { H3 } from "~/components/common/heading"
import { slot } from "~/lib/slot"
import { cx } from "~/lib/utils"

interface DataTableHeaderProps extends ComponentProps<"div"> {
  total?: number
  callToAction?: ReactNode
}

export function DataTableHeader({
  title,
  total,
  callToAction,
  children,
  className,
  ...props
}: DataTableHeaderProps) {
  return (
    <div
      className={cx(
        "sticky top-0 z-20 flex flex-col gap-4 py-4 -my-4 w-full bg-background overflow-auto",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-4">
        <H3 render={<h1 />}>
          {title}
          {total !== undefined && total !== null && (
            <span className="ml-1.5 opacity-40">({formatNumber(total)})</span>
          )}
        </H3>

        {slot(callToAction, { className: "-my-0.5" })}
      </div>

      {children}
    </div>
  )
}
