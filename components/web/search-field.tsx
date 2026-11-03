"use client"

import { SearchIcon } from "lucide-react"
import type { ComponentProps } from "react"
import { inputVariants } from "~/components/common/input"
import { Kbd } from "~/components/common/kbd"
import { useSearch } from "~/contexts/search-context"
import { cx } from "~/lib/utils"

/**
 * A button styled as a search input that opens the command menu search. The
 * children are its placeholder text.
 */
export function SearchField({ children, className, ...props }: ComponentProps<"button">) {
  const search = useSearch()

  return (
    <button
      type="button"
      className={cx(
        inputVariants({ size: "lg", interactive: true }),
        "flex items-center gap-3 text-start text-muted-foreground",
        className,
      )}
      onClick={search.open}
      {...props}
    >
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <span className="flex-1 truncate">{children}</span>
      <Kbd keys={["mod", "K"]} className="max-sm:hidden" />
    </button>
  )
}
