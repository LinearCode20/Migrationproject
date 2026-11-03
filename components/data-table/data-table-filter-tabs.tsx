"use client"

import type { Column } from "@tanstack/react-table"
import { SegmentedControl, SegmentedControlItem } from "~/components/common/segmented-control"
import type { Option } from "~/types"

interface DataTableFilterTabsProps<TData, TValue> {
  column: Column<TData, TValue>
  title?: string
  options: Option[]
}

/**
 * Single-select filter rendered as a segmented control, with a leading "All" option that
 * clears the filter. Reads and writes the same array-valued column filter as
 * {@link DataTableFacetedFilter}, so it is a drop-in for any single-select
 * filter field (opt in with `variant: "tabs"`).
 */
export function DataTableFilterTabs<TData, TValue>({
  column,
  title,
  options,
}: DataTableFilterTabsProps<TData, TValue>) {
  const value = (column.getFilterValue() as string[] | undefined)?.[0] ?? "all"

  function onValueChange(next: string) {
    column.setFilterValue(next === "all" ? undefined : [next])
  }

  return (
    <SegmentedControl
      variant="outline"
      value={value}
      aria-label={title}
      className="text-[0.8125rem]/tight"
      onValueChange={onValueChange}
    >
      <SegmentedControlItem value="all" className="px-2.5 py-1.5">
        All
      </SegmentedControlItem>

      {options.map(option => (
        <SegmentedControlItem key={option.value} value={option.value} className="px-2.5 py-1.5">
          {option.label}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  )
}
