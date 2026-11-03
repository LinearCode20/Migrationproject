"use client"

import type { ComponentProps } from "react"
import { Button } from "~/components/common/button"
import { useFilters } from "~/contexts/filter-context"
import { ALPHABET, NON_ALPHA_LETTER } from "~/lib/parsers"
import { cx } from "~/lib/utils"
import type { TagFilterSchema } from "~/server/tags/schema"

export function TagFilters({ className, ...props }: ComponentProps<"div">) {
  const { filters, updateFilters } = useFilters<TagFilterSchema>()

  return (
    <div
      className={cx("grid grid-cols-[repeat(auto-fit,minmax(2rem,1fr))] gap-1 w-full", className)}
      {...props}
    >
      {[...ALPHABET, NON_ALPHA_LETTER].map(letter => (
        <Button
          key={letter}
          variant={filters.letter === letter ? "primary" : "secondary"}
          aria-pressed={filters.letter === letter}
          className="px-2 py-1 text-sm font-medium text-center uppercase"
          onClick={() => updateFilters({ letter })}
        >
          {letter}
        </Button>
      ))}
    </div>
  )
}
