import { useRender } from "@base-ui/react/use-render"
import type { ComponentProps } from "react"
import { H5, type Heading } from "~/components/common/heading"
import { cva, cx, type VariantProps } from "~/lib/utils"

const tileVariants = cva({
  base: "group/tile flex justify-between items-center gap-4 min-w-0 -my-2 py-2",
})

interface TileProps extends useRender.ComponentProps<"div">, VariantProps<typeof tileVariants> {}

export function Tile({ className, render, ...props }: TileProps) {
  return useRender({
    render,
    defaultTagName: "div",
    props: { className: cx(tileVariants(), className), ...props },
  })
}

export function TileTitle({ className, children, ...props }: ComponentProps<typeof Heading>) {
  return (
    <H5 className={cx("flex min-w-0 items-center gap-2", className)} {...props}>
      <span className="truncate">{children}</span>
    </H5>
  )
}

export function TileDivider({ className, ...props }: ComponentProps<"hr">) {
  return <hr className={cx("min-w-2 flex-1 group-hover/tile:border-ring", className)} {...props} />
}

export function TileCaption({ className, ...props }: ComponentProps<"span">) {
  return <span className={cx("shrink-0 text-xs text-secondary-foreground", className)} {...props} />
}
