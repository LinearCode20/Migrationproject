"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ComponentProps } from "react"
import { Button, type ButtonProps } from "~/components/common/button"
import { Separator } from "~/components/common/separator"
import { Tooltip } from "~/components/common/tooltip"
import { cx } from "~/lib/utils"

export interface NavLink extends ButtonProps {
  title: string
  /** Where the entry goes. Leave it out for an entry that acts (`onClick`), which renders a button. */
  href?: string
}

interface NavProps extends ComponentProps<"nav"> {
  isCollapsed: boolean
  links: (NavLink | undefined)[]
}

const rootPath = "/app"

export function Nav({ className, links, isCollapsed, ...props }: NavProps) {
  const pathname = usePathname()

  function isActive(href?: string) {
    if (!href) {
      return false
    }

    return href === rootPath ? pathname === href : pathname.startsWith(href)
  }

  return (
    <nav
      className={cx(
        "flex flex-col gap-1 p-3 group-data-[collapsed=true]/collapsible:justify-center group-data-[collapsed=true]/collapsible:px-2",
        className,
      )}
      {...props}
    >
      {links.map((link, index) => {
        if (!link) {
          return <Separator key={index} className="my-2 -mx-3 w-auto" />
        }

        const { href, title, suffix, ...buttonProps } = link

        // The active entry is styled from `aria-current`, so the look and what assistive tech
        // hears come from the same attribute.
        return (
          <Tooltip key={index} side="right" tooltip={isCollapsed && title}>
            <Button
              size="md"
              variant="ghost"
              suffix={suffix && <span className="max-md:hidden">{suffix}</span>}
              render={href ? <Link href={href} /> : undefined}
              aria-current={isActive(href) ? "page" : undefined}
              className="justify-start font-sans max-md:justify-center aria-[current=page]:bg-accent aria-[current=page]:text-foreground"
              {...buttonProps}
            >
              <span className="max-md:sr-only">{title}</span>
            </Button>
          </Tooltip>
        )
      })}
    </nav>
  )
}
