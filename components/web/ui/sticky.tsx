import { useRender } from "@base-ui/react/use-render"
import { type ComponentProps, isValidElement, type ReactElement } from "react"
import { cva, cx, type VariantProps } from "~/lib/utils"

const stickyVariants = cva({
  base: "md:sticky md:z-49",

  variants: {
    isOverlay: {
      true: "md:top-(--header-inner-offset) md:p-(--header-bottom) md:-m-(--header-bottom) md:bg-background",
      false: "md:top-(--header-outer-offset)",
    },
  },

  defaultVariants: {
    isOverlay: false,
  },
})

interface StickyProps extends ComponentProps<"div">, VariantProps<typeof stickyVariants> {}

export function Sticky({ className, isOverlay, children, ...props }: StickyProps) {
  return useRender({
    render: isValidElement(children) ? (children as ReactElement) : undefined,
    defaultTagName: "div",
    props: isValidElement(children)
      ? { className: cx(stickyVariants({ isOverlay }), className), ...props }
      : { className: cx(stickyVariants({ isOverlay }), className), ...props, children },
  })
}
