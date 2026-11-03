"use client"

import type { Table } from "@tanstack/react-table"
import { PlusIcon } from "lucide-react"
import Link from "next/link"
import type { inferParserType, ParserMap } from "nuqs"
import type { ReactNode } from "react"
import { DateRangePicker } from "~/components/app/date-range-picker"
import { Button } from "~/components/common/button"
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar"
import { DataTableViewOptions } from "~/components/data-table/data-table-view-options"
import { isDefaultState } from "~/lib/parsers"
import type { DataTableFilterField } from "~/types"

interface AdminTableToolbarProps<TData, TParsers extends ParserMap> {
  table: Table<TData>
  filterFields: DataTableFilterField<TData>[]
  listParams: TParsers
  params: inferParserType<TParsers>
  setParams: (values: null) => unknown
  deleteDialog?: ReactNode
}

/** Filters, reset, bulk delete, date range, and column visibility for admin tables. */
export function AdminTableToolbar<TData, TParsers extends ParserMap>({
  table,
  filterFields,
  listParams,
  params,
  setParams,
  deleteDialog,
}: AdminTableToolbarProps<TData, TParsers>) {
  return (
    <DataTableToolbar
      table={table}
      filterFields={filterFields}
      isFiltered={!isDefaultState(listParams, params, ["perPage", "page"])}
      onReset={() => {
        table.resetColumnFilters()
        void setParams(null)
      }}
    >
      {deleteDialog}
      <DateRangePicker align="end" />
      <DataTableViewOptions table={table} />
    </DataTableToolbar>
  )
}

interface NewEntityButtonProps {
  href: string
  children: ReactNode
}

export function NewEntityButton({ href, children }: NewEntityButtonProps) {
  return (
    <Button variant="primary" size="md" prefix={<PlusIcon />} render={<Link href={href} />}>
      <span className="max-sm:sr-only">{children}</span>
    </Button>
  )
}
