"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { HashIcon } from "lucide-react"
import { useQueryStates } from "nuqs"
import { AdminTableToolbar, NewEntityButton } from "~/components/app/admin-table"
import { TagActions } from "~/components/app/tags/tag-actions"
import { Badge } from "~/components/common/badge"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import {
  createActionsColumn,
  createDateColumn,
  createNameColumn,
  createSelectColumn,
} from "~/components/data-table/data-table-column-helpers"
import { DataTableDeleteDialog } from "~/components/data-table/data-table-delete-dialog"
import { DataTableHeader } from "~/components/data-table/data-table-header"
import { useCan } from "~/contexts/user-context"
import { useDataTable } from "~/hooks/use-data-table"
import { orpc } from "~/lib/orpc-query"
import type { findTags } from "~/server/tags/queries"
import { tagListParams } from "~/server/tags/schema"
import type { DataTableFilterField } from "~/types"

type TagRow = Awaited<ReturnType<typeof findTags>>["tags"][number]

const columns: ColumnDef<TagRow>[] = [
  createSelectColumn<TagRow>(),
  createNameColumn<TagRow>({
    title: "Name",
    href: row => `/app/tags/${row.id}`,
  }),
  {
    accessorKey: "_count.tools",
    enableSorting: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tools" />,
    cell: ({ row }) => (
      <Badge prefix={<HashIcon className="opacity-50 size-3!" />} className="tabular-nums">
        {row.original._count.tools}
      </Badge>
    ),
  },
  createDateColumn<TagRow>("createdAt", "Created At"),
  createActionsColumn<TagRow>(tag => <TagActions tag={tag} className="float-right" />),
]

export function TagTable() {
  const canDelete = useCan("tags.delete")
  const [params, setParams] = useQueryStates(tagListParams)

  const { data, isLoading, isFetching } = useQuery(
    orpc.tags.list.queryOptions({
      input: params,
      placeholderData: keepPreviousData,
    }),
  )

  const filterFields: DataTableFilterField<TagRow>[] = [
    {
      id: "name",
      label: "Name",
    },
  ]

  const { table } = useDataTable({
    data: data?.tags ?? [],
    columns,
    pageCount: data?.pageCount ?? 0,
    filterFields,
    initialState: {
      pagination: { pageIndex: 0, pageSize: params.perPage },
      sorting: params.sort,
      columnPinning: { right: ["actions"] },
    },
    getRowId: row => row.id,
  })

  return (
    <DataTable table={table} isLoading={isLoading} isFetching={isFetching && !isLoading}>
      <DataTableHeader
        title="Tags"
        total={data?.total}
        callToAction={<NewEntityButton href="/app/tags/new">New tag</NewEntityButton>}
      >
        <AdminTableToolbar
          table={table}
          filterFields={filterFields}
          listParams={tagListParams}
          params={params}
          setParams={setParams}
          deleteDialog={
            canDelete && (
              <DataTableDeleteDialog
                table={table}
                label="tag"
                mutationOptions={orpc.tags.remove.mutationOptions}
                queryKey={orpc.tags.key()}
              />
            )
          }
        />
      </DataTableHeader>
    </DataTable>
  )
}
