import { useRender } from "@base-ui/react/use-render"
import { cva, cx, type VariantProps } from "~/lib/utils"

const headingVariants = cva({
  base: "font-display font-[550]",

  variants: {
    size: {
      h1: "text-3xl tracking-tight text-balance bg-linear-to-b from-foreground to-foreground/75 bg-clip-text text-transparent md:text-4xl",
      h2: "text-2xl tracking-tight md:text-3xl",
      h3: "text-2xl tracking-tight",
      h4: "text-xl tracking-tight",
      h5: "text-base font-sans font-medium",
      h6: "text-sm/tight font-sans font-medium",
    },
  },

  defaultVariants: {
    size: "h3",
  },
})

export interface HeadingProps
  extends Omit<useRender.ComponentProps<"h2">, "size">, VariantProps<typeof headingVariants> {}

export function Heading({ className, render, size, ...props }: HeadingProps) {
  return useRender({
    render,
    defaultTagName: (size ?? "h2") as keyof React.JSX.IntrinsicElements,
    props: { className: cx(headingVariants({ size }), className), ...props },
  })
}

export function H1(props: HeadingProps) {
  return <Heading size="h1" {...props} />
}
export function H2(props: HeadingProps) {
  return <Heading size="h2" {...props} />
}
export function H3(props: HeadingProps) {
  return <Heading size="h3" {...props} />
}
export function H4(props: HeadingProps) {
  return <Heading size="h4" {...props} />
}
export function H5(props: HeadingProps) {
  return <Heading size="h5" {...props} />
}
export function H6(props: HeadingProps) {
  return <Heading size="h6" {...props} />
}
