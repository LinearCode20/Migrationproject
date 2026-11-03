"use client"

import { formatDate } from "@dirstack/utils"
import type { ColumnDef, Row } from "@tanstack/react-table"
import type { ReactNode } from "react"
import { RowCheckbox } from "~/components/app/row-checkbox"
import { Note } from "~/components/common/note"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { DataTableLink } from "~/components/data-table/data-table-link"

interface CreateSelectColumnOptions<TData> {
  isDisabled?: (row: Row<TData>) => boolean
}

/**
 * Creates the standard select column used across all admin tables.
 * Pass isDisabled to conditionally disable row selection (e.g. admin users).
 */
export function createSelectColumn<TData>(
  options?: CreateSelectColumnOptions<TData>,
): ColumnDef<TData> {
  return {
    id: "select",
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <RowCheckbox
        ref={input => {
          if (input) {
            input.indeterminate =
              table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
          }
        }}
        checked={table.getIsAllPageRowsSelected()}
        aria-label="Select all"
        onChange={event => table.toggleAllPageRowsSelected(event.target.checked)}
      />
    ),
    cell: ({ row, table }) => (
      <RowCheckbox
        checked={row.getIsSelected()}
        disabled={options?.isDisabled?.(row)}
        aria-label="Select row"
        table={table}
        row={row}
        onChange={event => row.toggleSelected(event.target.checked)}
      />
    ),
  }
}

/**
 * Creates a standard date column with consistent formatting.
 * Renders "-" when the date is null.
 */
export function createDateColumn<TData>(
  key: keyof TData & string,
  title: string,
): ColumnDef<TData> {
  return {
    accessorKey: key,
    header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
    cell: ({ row }) => {
      const value = row.getValue<Date | null>(key)
      return <Note>{value ? formatDate(value) : "-"}</Note>
    },
  }
}

interface CreateNameColumnOpts<TData> {
  title: string
  key?: keyof TData & string
  href: (row: TData) => string
  image?: (row: TData) => string | null | undefined
  badge?: (row: TData) => ReactNode
  getTitle?: (row: TData) => string
  size?: number
}

/**
 * Creates a name/title column with a DataTableLink, optional favicon, and optional badge.
 */
export function createNameColumn<TData>({
  title,
  key,
  href,
  image,
  badge,
  getTitle,
  size = 160,
}: CreateNameColumnOpts<TData>): ColumnDef<TData> {
  const accessorKey = (key ?? "name") as keyof TData & string

  return {
    accessorKey,
    enableHiding: false,
    size,
    header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
    cell: ({ row }) => (
      <DataTableLink
        href={href(row.original)}
        image={image?.(row.original) ?? undefined}
        title={getTitle ? getTitle(row.original) : String(row.getValue(accessorKey))}
      >
        {badge?.(row.original)}
      </DataTableLink>
    ),
  }
}

/**
 * Creates the standard actions column. The render function receives the row data.
 */
export function createActionsColumn<TData>(render: (row: TData) => ReactNode): ColumnDef<TData> {
  return {
    id: "actions",
    cell: ({ row }) => render(row.original),
  }
}
