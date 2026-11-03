import { useRender } from "@base-ui/react/use-render"
import type { ReactNode } from "react"
import { slot } from "~/lib/slot"
import { cva, cx, type VariantProps } from "~/lib/utils"

const tagVariants = cva({
  base: "flex items-center gap-0.5 text-muted-foreground text-sm hover:[[href]]:text-foreground",
})

interface TagProps
  extends Omit<useRender.ComponentProps<"span">, "prefix">, VariantProps<typeof tagVariants> {
  prefix?: ReactNode
  suffix?: ReactNode
}

export function Tag({ children, className, render, prefix, suffix, ...props }: TagProps) {
  const content = (
    <>
      {prefix && slot(prefix, { className: "opacity-30 mr-0.5" })}
      {children}
      {suffix && slot(suffix, { className: "opacity-30 ml-0.5" })}
    </>
  )

  return useRender({
    render,
    defaultTagName: "span",
    props: { className: cx(tagVariants(), className), children: content, ...props },
  })
}
