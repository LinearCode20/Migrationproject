import { mergeProps } from "@base-ui/react"
import { useRender } from "@base-ui/react/use-render"
import type { ReactNode } from "react"
import { slot } from "~/lib/slot"
import { cva, cx, type VariantProps } from "~/lib/utils"

const badgeVariants = cva({
  base: "inline-flex items-center rounded-sm text-secondary-foreground font-medium leading-tight border border-transparent whitespace-nowrap",

  slots: {
    affix: "shrink-0 size-[1.1em]",
  },

  variants: {
    variant: {
      primary: "bg-primary text-background hover:[&[href],&[type]]:bg-primary/75",
      soft: "bg-border/50 hover:[&[href],&[type]]:bg-border/75",
      outline: "bg-background border-border hover:[&[href],&[type]]:bg-muted",
      success:
        "bg-success-tint/(--tint-alpha) text-success-text hover:[&[href],&[type]]:bg-success-tint/(--tint-alpha-hover)",
      warning:
        "bg-warning-tint/(--tint-alpha) text-warning-text hover:[&[href],&[type]]:bg-warning-tint/(--tint-alpha-hover)",
      info: "bg-info-tint/(--tint-alpha) text-info-text hover:[&[href],&[type]]:bg-info-tint/(--tint-alpha-hover)",
      danger:
        "bg-destructive-tint/(--tint-alpha) text-destructive-text hover:[&[href],&[type]]:bg-destructive-tint/(--tint-alpha-hover)",
    },
    size: {
      sm: "px-1 py-px gap-1 text-[0.625rem]",
      md: "px-1.5 py-0.5 gap-1.5 text-xs",
      lg: "px-2 py-1 gap-2 text-sm rounded-md",
    },
  },

  defaultVariants: {
    variant: "soft",
    size: "md",
  },
})

interface BadgeProps
  extends Omit<useRender.ComponentProps<"span">, "prefix">, VariantProps<typeof badgeVariants> {
  prefix?: ReactNode
  suffix?: ReactNode
}

export function Badge({
  children,
  className,
  render,
  variant,
  size,
  prefix,
  suffix,
  ...rest
}: BadgeProps) {
  const { base, affix } = badgeVariants({ variant, size })

  const props = mergeProps<"span">(
    {
      className: cx(base(), className),
      children: (
        <>
          {prefix && slot(prefix, { className: affix() })}
          {children}
          {suffix && slot(suffix, { className: affix() })}
        </>
      ),
    },
    rest,
  )

  return useRender({ defaultTagName: "span", render, props })
}
