import { useRender } from "@base-ui/react/use-render"
import { cva, cx, type VariantProps } from "~/lib/utils"

const containerVariants = cva({
  base: "relative w-full max-w-272 mx-auto px-6 lg:px-8",
})

interface ContainerProps
  extends useRender.ComponentProps<"div">, VariantProps<typeof containerVariants> {}

export function Container({ className, render, ...props }: ContainerProps) {
  return useRender({
    render,
    defaultTagName: "div",
    props: { className: cx(containerVariants(), className), ...props },
  })
}
