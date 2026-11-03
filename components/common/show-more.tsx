"use client"

import { useTranslations } from "next-intl"
import { Children, type ComponentProps, useState } from "react"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"

interface ShowMoreProps extends ComponentProps<typeof Stack> {
  limit?: number
  buffer?: number
  showMoreType?: "link" | "text" | "none"
}

export function ShowMore({
  children,
  limit = 4,
  buffer = 1,
  showMoreType = "link",
  ...props
}: ShowMoreProps) {
  const t = useTranslations("components.show_more")
  const [showAll, setShowAll] = useState(false)

  const items = Children.toArray(children)
  const shouldShowAll = showAll || items.length <= limit + buffer
  const visibleItems = shouldShowAll ? items : items.slice(0, limit)
  const hiddenCount = items.length - limit
  const showMoreText = t("more", { count: hiddenCount })

  if (!items.length) {
    return null
  }

  return (
    <Stack {...props}>
      {visibleItems}

      {!shouldShowAll &&
        hiddenCount > 0 &&
        showMoreType !== "none" &&
        (showMoreType === "link" ? (
          <button
            type="button"
            className="py-1 rounded-sm font-medium text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowAll(true)}
          >
            {showMoreText}
          </button>
        ) : (
          <Note className="text-xs">{showMoreText}</Note>
        ))}
    </Stack>
  )
}
