"use client"

import { motion } from "motion/react"
import { type ComponentProps, type ReactNode, useId } from "react"
import { InlineMenu } from "~/components/web/inline-menu"
import { cx } from "~/lib/utils"

interface TableOfContentsProps extends Omit<
  ComponentProps<typeof InlineMenu>,
  "items" | "renderItem"
> {
  headings: { id: string; text: ReactNode; level: number }[]
}

export function TableOfContents({ headings, ...props }: TableOfContentsProps) {
  const id = useId()

  if (!headings.length) {
    return null
  }

  // Indents relative to the shallowest heading level.
  const minLevel = Math.min(...headings.map(heading => heading.level))

  return (
    <InlineMenu
      items={headings}
      renderItem={(heading, isActive) => {
        const indentLevel = heading.level - minLevel

        return (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            aria-current={isActive ? "location" : undefined}
            className={cx(
              "relative block py-1 text-sm leading-relaxed border-l-2 border-accent",
              indentLevel === 0 && "pl-4",
              indentLevel === 1 && "pl-8",
              indentLevel === 2 && "pl-10",
              indentLevel >= 3 && "pl-12",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {heading.text}

            {isActive && (
              <motion.div
                layoutId={`toc-indicator-${id}`}
                transition={{ type: "tween", duration: 0.15, ease: "easeOut" }}
                className="absolute z-10 -left-0.5 inset-y-0 w-0.5 bg-foreground rounded-full"
              />
            )}
          </a>
        )
      }}
      {...props}
    />
  )
}
