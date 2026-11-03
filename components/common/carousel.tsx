"use client"

import { type ComponentProps, useLayoutEffect, useRef } from "react"
import { cx } from "~/lib/utils"

/*
 * Below the `md` breakpoint, the children scroll sideways one at a time, with position dots
 * under the row. The row bleeds into the page gutter, so a card can slide off the screen edge.
 * From `md` up it is a plain flex row: pass layout classes (wrap, justify, gap) for that.
 * The outer div keeps the dots next to the row, clear of any gap on the parent.
 *
 * The row opens on the first child with `data-highlighted`. CSS `scroll-initial-target` does it
 * before hydration where supported. Elsewhere the effect below scrolls once on mount.
 */
export function Carousel({ className, ...props }: ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const row = ref.current

    if (!row || CSS.supports("scroll-initial-target", "nearest")) {
      return
    }

    if (row.scrollWidth <= row.clientWidth) {
      return
    }

    const target = row.querySelector<HTMLElement>(":scope > [data-highlighted]")

    if (target) {
      const left = target.offsetLeft - (row.clientWidth - target.offsetWidth) / 2
      row.scrollTo({ left, behavior: "instant" })
    }
  }, [])

  return (
    <div className="max-md:self-stretch">
      <div
        ref={ref}
        className={cx(
          "relative flex",
          "max-md:-mx-6 max-md:px-6 max-md:snap-row max-md:justify-center-safe max-md:carousel-markers",
          "max-md:[&>[data-highlighted]]:[scroll-initial-target:nearest]",
          className,
        )}
        {...props}
      />
    </div>
  )
}
