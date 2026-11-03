import { mergeProps } from "@base-ui/react"
import { useRender } from "@base-ui/react/use-render"
import type { WithOptional } from "@dirstack/utils"
import Link from "next/link"
import type { ReactNode } from "react"
import { slot } from "~/lib/slot"
import { cva, cx, type VariantProps } from "~/lib/utils"

export const navLinkVariants = cva({
  base: "group flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none",

  slots: {
    affix: "shrink-0 size-4 opacity-75",
  },

  variants: {
    isActive: {
      true: "text-foreground",
      false: "text-muted-foreground hover:[&[href],&[type]]:text-foreground",
    },
    isPadded: {
      true: "p-0.5 -m-0.5",
    },
  },

  defaultVariants: {
    isActive: false,
    isPadded: true,
  },
})

interface NavLinkProps
  extends
    Omit<WithOptional<useRender.ComponentProps<typeof Link>, "href">, "prefix">,
    VariantProps<typeof navLinkVariants> {
  prefix?: ReactNode
  suffix?: ReactNode
}

export function NavLink({
  children,
  className,
  isActive,
  isPadded,
  render,
  prefix,
  suffix,
  href,
  ...rest
}: NavLinkProps) {
  const { base, affix } = navLinkVariants({ isActive, isPadded })

  const props = mergeProps<"a">(
    {
      className: cx(base(), className),
      children: (
        <>
          {slot(prefix, { className: affix() })}
          {children}
          {slot(suffix, { className: affix() })}
        </>
      ),
    },
    rest,
  )

  return useRender({
    render: render ?? (href ? <Link href={href} /> : <button />),
    props,
  })
}
