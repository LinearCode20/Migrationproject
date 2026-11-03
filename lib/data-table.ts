import type { Column } from "@tanstack/react-table"
import type { CSSProperties } from "react"

interface GetColumnPinningStyleOptions<TData> {
  column: Column<TData>
}

export function getColumnPinningStyle<TData>({
  column,
}: GetColumnPinningStyleOptions<TData>): CSSProperties {
  const isPinned = column.getIsPinned()

  return {
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    position: isPinned ? "sticky" : undefined,
    zIndex: isPinned ? 10 : undefined,
  }
}
