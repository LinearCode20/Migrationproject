"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { HashIcon } from "lucide-react"
import { useQueryStates } from "nuqs"
import { AdminTableToolbar, NewEntityButton } from "~/components/app/admin-table"
import { CategoryActions } from "~/components/app/categories/category-actions"
import { Badge } from "~/components/common/badge"
import { Note } from "~/components/common/note"
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
import type { findCategories } from "~/server/categories/queries"
import { categoryListParams } from "~/server/categories/schema"
import type { DataTableFilterField } from "~/types"

type CategoryRow = Awaited<ReturnType<typeof findCategories>>["categories"][number]

const columns: ColumnDef<CategoryRow>[] = [
  createSelectColumn<CategoryRow>(),
  createNameColumn<CategoryRow>({
    title: "Name",
    href: row => `/app/categories/${row.id}`,
  }),
  {
    accessorKey: "label",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Label" />,
    cell: ({ row }) => (
      <Note title={row.original.label ?? undefined} className="max-w-96 truncate">
        {row.original.label}
      </Note>
    ),
  },
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
  createDateColumn<CategoryRow>("createdAt", "Created At"),
  createActionsColumn<CategoryRow>(category => (
    <CategoryActions category={category} className="float-right" />
  )),
]

export function CategoryTable() {
  const canDelete = useCan("categories.delete")
  const [params, setParams] = useQueryStates(categoryListParams)

  const { data, isLoading, isFetching } = useQuery(
    orpc.categories.list.queryOptions({
      input: params,
      placeholderData: keepPreviousData,
    }),
  )

  const filterFields: DataTableFilterField<CategoryRow>[] = [
    {
      id: "name",
      label: "Name",
    },
  ]

  const { table } = useDataTable({
    data: data?.categories ?? [],
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
        title="Categories"
        total={data?.total}
        callToAction={<NewEntityButton href="/app/categories/new">New category</NewEntityButton>}
      >
        <AdminTableToolbar
          table={table}
          filterFields={filterFields}
          listParams={categoryListParams}
          params={params}
          setParams={setParams}
          deleteDialog={
            canDelete && (
              <DataTableDeleteDialog
                table={table}
                label="category"
                mutationOptions={orpc.categories.remove.mutationOptions}
                queryKey={orpc.categories.key()}
              />
            )
          }
        />
      </DataTableHeader>
    </DataTable>
  )
}
