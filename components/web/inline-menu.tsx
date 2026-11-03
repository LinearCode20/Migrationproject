"use client"

import { useScrollSpy } from "@mantine/hooks"
import { AlignLeftIcon, ChevronDownIcon } from "lucide-react"
import { AnimatePresence, motion, MotionConfig } from "motion/react"
import { useTranslations } from "next-intl"
import type { ComponentProps, ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Stack } from "~/components/common/stack"
import { cx } from "~/lib/utils"

interface InlineMenuProps<T extends { id: string }> extends ComponentProps<"div"> {
  items: T[]
  renderItem: (item: T, isActive: boolean, index: number) => ReactNode
  collapsible?: boolean
  showHeader?: boolean
}

export function InlineMenu<T extends { id: string }>({
  children,
  className,
  items,
  renderItem,
  title,
  collapsible = true,
  showHeader = true,
  ...props
}: InlineMenuProps<T>) {
  const t = useTranslations("common")
  const [isOpen, setIsOpen] = useState(true)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const navRef = useRef<HTMLElement | null>(null)
  const selector = useMemo(() => items.map(({ id }) => `[id="${id}"]`).join(","), [items])
  const { active, data } = useScrollSpy({ selector })
  const activeId = data[active]?.id

  // Contains the scroll only when the list overflows. A non-overflowing list would
  // otherwise swallow the wheel event instead of letting the page scroll.
  const observeNav = useCallback((node: HTMLElement | null) => {
    navRef.current = node

    if (!node) {
      return
    }

    const observer = new ResizeObserver(() => {
      setIsOverflowing(node.scrollHeight > node.clientHeight)
    })

    observer.observe(node)

    return () => {
      observer.disconnect()
      navRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!activeId || !isOverflowing) {
      return
    }

    const activeMenuElement = navRef.current?.querySelector(`a[href="#${activeId}"]`)
    activeMenuElement?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [activeId, isOverflowing])

  return (
    <div
      className={cx("flex flex-col gap-3 flex-1 overflow-hidden max-md:hidden lg:px-5", className)}
      {...props}
    >
      {showHeader && (
        <Stack
          size="sm"
          wrap={false}
          render={
            <button
              type="button"
              disabled={!collapsible}
              aria-expanded={isOpen}
              onClick={() => setIsOpen(!isOpen)}
            />
          }
          className="group text-start w-full text-muted-foreground enabled:hover:text-foreground"
        >
          <AlignLeftIcon />
          <span className="flex-1 truncate text-sm">{title || t("on_this_page")}</span>
          {collapsible && (
            <ChevronDownIcon className={cx("duration-200", isOpen && "rotate-180")} />
          )}
        </Stack>
      )}

      <MotionConfig reducedMotion="user">
        <AnimatePresence initial={false}>
          {(!collapsible || isOpen) && (
            <motion.nav
              ref={observeNav}
              initial={collapsible ? { height: 0 } : false}
              animate={{ height: "auto" }}
              exit={collapsible ? { height: 0 } : undefined}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cx(
                "flex flex-col overflow-y-auto scroll-smooth",
                isOverflowing && "overscroll-contain",
              )}
            >
              {items.map((item, index) => renderItem(item, activeId === item.id, index))}
              {children}
            </motion.nav>
          )}
        </AnimatePresence>
      </MotionConfig>
    </div>
  )
}
