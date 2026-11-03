"use client"

import { useHotkeys } from "@mantine/hooks"
import type { Table } from "@tanstack/react-table"
import { XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { type ComponentProps, useRef } from "react"
import { Button } from "~/components/common/button"
import { Input } from "~/components/common/input"
import { Kbd } from "~/components/common/kbd"
import { Stack } from "~/components/common/stack"
import { DataTableFacetedFilter } from "~/components/data-table/data-table-faceted-filter"
import { DataTableFilterTabs } from "~/components/data-table/data-table-filter-tabs"
import { cx } from "~/lib/utils"
import type { DataTableFilterField } from "~/types"

interface DataTableToolbarProps<TData> extends ComponentProps<"div"> {
  table: Table<TData>
  filterFields?: DataTableFilterField<TData>[]
  isFiltered?: boolean
  onReset?: () => void
}

export function DataTableToolbar<TData>({
  table,
  filterFields = [],
  isFiltered: isFilteredProp,
  onReset,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const t = useTranslations("components.data_table.toolbar")
  const hasColumnFilters = table.getState().columnFilters.length > 0
  const isFiltered = isFilteredProp ?? hasColumnFilters
  const inputRef = useRef<HTMLInputElement>(null)

  useHotkeys([["/", () => inputRef.current?.focus()]], [], true)

  const fields = filterFields.flatMap(field => {
    const column = table.getColumn(field.id)
    return column ? [{ field, column }] : []
  })

  const searchFields = fields.filter(({ field }) => !field.options)
  const tabFields = fields.filter(({ field }) => field.options && field.variant === "tabs")
  const facetedFields = fields.filter(({ field }) => field.options && field.variant !== "tabs")

  return (
    <Stack
      size="sm"
      wrap={false}
      className={cx("justify-between w-full py-1 -my-1 overflow-auto", className)}
      {...props}
    >
      <Stack size="sm" wrap={false}>
        {searchFields.map(({ field, column }) => (
          <div key={field.id} className="relative">
            <Input
              ref={inputRef}
              placeholder={t("search")}
              aria-label={t("search")}
              value={String(column.getFilterValue() ?? "")}
              className="w-32 transition-[width] focus:w-40 lg:focus:w-60"
              onChange={event => column.setFilterValue(event.target.value)}
            />

            <Kbd
              keys={["/"]}
              className="absolute right-2 top-1/2 -translate-y-1/2 m-0 pointer-events-none"
            />
          </div>
        ))}

        {tabFields.map(({ field, column }) => (
          <DataTableFilterTabs
            key={field.id}
            column={column}
            title={field.label}
            options={field.options ?? []}
          />
        ))}

        {facetedFields.map(({ field, column }) => (
          <DataTableFacetedFilter
            key={field.id}
            column={column}
            title={field.label}
            options={field.options ?? []}
          />
        ))}

        {isFiltered && (
          <Button
            aria-label={t("reset_filters")}
            variant="ghost"
            size="md"
            suffix={<XIcon />}
            onClick={onReset ?? (() => table.resetColumnFilters())}
          >
            {t("reset")}
          </Button>
        )}
      </Stack>

      <Stack size="sm" wrap={false}>
        {children}
      </Stack>
    </Stack>
  )
}
