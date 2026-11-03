"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { DeleteDialog } from "~/components/app/dialogs/delete-dialog"
import { Button } from "~/components/common/button"

interface DataTableDeleteDialogProps<TData extends { id: string }> extends Pick<
  ComponentProps<typeof DeleteDialog>,
  "label" | "mutationOptions" | "queryKey"
> {
  table: Table<TData>

  /** Overrides the default copy for entities whose delete is not a permanent purge. */
  description?: (rows: TData[]) => ReactNode
}

export function DataTableDeleteDialog<TData extends { id: string }>({
  table,
  label,
  mutationOptions,
  queryKey,
  description,
}: DataTableDeleteDialogProps<TData>) {
  const { rows } = table.getFilteredSelectedRowModel()

  if (!rows.length) {
    return null
  }

  return (
    <DeleteDialog
      ids={rows.map(row => row.original.id)}
      label={label}
      mutationOptions={mutationOptions}
      queryKey={queryKey}
      description={description?.(rows.map(row => row.original))}
    >
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </DeleteDialog>
  )
}
