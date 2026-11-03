"use client"

import { flexRender, type Table as TanstackTable } from "@tanstack/react-table"
import { useTranslations } from "next-intl"
import type { ComponentProps, CSSProperties, ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/common/table"
import { DataTablePagination } from "~/components/data-table/data-table-pagination"
import { DataTableSkeletonRows } from "~/components/data-table/data-table-skeleton"
import { getColumnPinningStyle } from "~/lib/data-table"
import { cx } from "~/lib/utils"

interface DataTableProps<TData> extends ComponentProps<typeof Table> {
  /** The table instance returned from `useDataTable`. */
  table: TanstackTable<TData>

  /** Rendered when the table has no rows. Defaults to a translated message. */
  emptyState?: ReactNode

  /** Dims the table while new data loads, e.g. after a filter change. */
  isFetching?: boolean

  /** Shows skeleton rows in place of the table while the first page loads. */
  isLoading?: boolean
}

export function DataTable<TData>({
  table,
  emptyState,
  isFetching = false,
  isLoading = false,
  children,
  className,
  ...props
}: DataTableProps<TData>) {
  const t = useTranslations("components.data_table")
  const visibleColumns = table.getVisibleLeafColumns()
  const { rows } = table.getRowModel()

  const gridColumns = visibleColumns.map(column =>
    column.getSize() > 0 ? `minmax(${column.getSize()}px, 1fr)` : "auto",
  )

  return (
    <>
      {children}

      <Table
        aria-busy={isLoading || isFetching || undefined}
        style={
          {
            "--table-columns": isLoading
              ? `repeat(${visibleColumns.length}, minmax(0, 1fr))`
              : gridColumns.join(" "),
          } as CSSProperties
        }
        className={cx(
          "rounded-md border transition-opacity",
          isFetching && "opacity-50 pointer-events-none",
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <DataTableSkeletonRows columnCount={visibleColumns.length} />
        ) : (
          <>
            {!!rows.length && (
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id} style={getColumnPinningStyle(header)}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
            )}

            <TableBody>
              {rows.length ? (
                rows.map(row => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        style={getColumnPinningStyle({ column: cell.column })}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow aria-disabled className="h-24">
                  <TableCell className="col-span-full text-center">
                    {emptyState ?? t("empty_state")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </>
        )}
      </Table>

      <DataTablePagination table={table} />
    </>
  )
}
