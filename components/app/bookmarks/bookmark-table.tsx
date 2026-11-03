"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { BookmarkXIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useQueryStates } from "nuqs"
import { useMemo } from "react"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import { Note } from "~/components/common/note"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import {
  createActionsColumn,
  createNameColumn,
} from "~/components/data-table/data-table-column-helpers"
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar"
import { useDataTable } from "~/hooks/use-data-table"
import { orpc } from "~/lib/orpc-query"
import type { BookmarkedTool } from "~/server/bookmarks/payloads"
import type { findBookmarkedTools } from "~/server/bookmarks/queries"
import { bookmarkListParams } from "~/server/bookmarks/schema"
import type { DataTableFilterField } from "~/types"

interface BookmarkRemoveButtonProps {
  toolId: string
}

function BookmarkRemoveButton({ toolId }: BookmarkRemoveButtonProps) {
  const t = useTranslations("pages.dashboard.table")
  const router = useRouter()
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation(
    orpc.bookmarks.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.bookmarks.key() })
        toast.success(t("bookmarks.success_message"))
        router.refresh()
      },
    }),
  )

  return (
    <Button
      size="sm"
      variant="secondary"
      prefix={<BookmarkXIcon />}
      isPending={isPending}
      className="float-right -my-1"
      onClick={() => mutate({ toolId })}
    >
      {t("bookmarks.remove_button")}
    </Button>
  )
}

export function BookmarkTable({
  tools,
  pageCount,
}: Awaited<ReturnType<typeof findBookmarkedTools>>) {
  const t = useTranslations("pages.dashboard.table")
  const [{ perPage, sort }] = useQueryStates(bookmarkListParams)

  const columns = useMemo(
    (): ColumnDef<BookmarkedTool>[] => [
      createNameColumn<BookmarkedTool>({
        title: t("columns.name"),
        href: row => `/${row.slug}`,
        image: row => row.faviconUrl,
      }),
      {
        accessorKey: "tagline",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("columns.tagline")} />
        ),
        cell: ({ row }) => <Note className="truncate">{row.original.tagline}</Note>,
      },
      createActionsColumn<BookmarkedTool>(tool => <BookmarkRemoveButton toolId={tool.id} />),
    ],
    [],
  )

  const filterFields: DataTableFilterField<BookmarkedTool>[] = [
    {
      id: "name",
      label: t("filters.name_label"),
    },
  ]

  const { table } = useDataTable({
    data: tools,
    columns,
    pageCount,
    filterFields,
    shallow: false,
    enableHiding: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: perPage },
      sorting: sort,
      columnPinning: { right: ["actions"] },
    },
    getRowId: row => row.slug,
  })

  return (
    <DataTable table={table} emptyState={t("bookmarks.empty_state")}>
      <DataTableToolbar table={table} filterFields={filterFields} />
    </DataTable>
  )
}
