import { useRender } from "@base-ui/react/use-render"
import { cva, cx, type VariantProps } from "~/lib/utils"

const stackVariants = cva({
  base: "flex",

  variants: {
    size: {
      xs: "gap-1",
      sm: "gap-x-2 gap-y-1",
      md: "gap-x-3 gap-y-2",
      lg: "gap-x-4 gap-y-3",
    },
    direction: {
      row: "flex-row items-center place-content-start",
      column: "flex-col items-start",
    },
    wrap: {
      true: "flex-wrap",
      false: "",
    },
  },

  defaultVariants: {
    size: "md",
    direction: "row",
    wrap: true,
  },
})

interface StackProps extends useRender.ComponentProps<"div">, VariantProps<typeof stackVariants> {}

export function Stack({ className, render, size, direction, wrap, ...props }: StackProps) {
  return useRender({
    render,
    defaultTagName: "div",
    props: { className: cx(stackVariants({ size, direction, wrap }), className), ...props },
  })
}
