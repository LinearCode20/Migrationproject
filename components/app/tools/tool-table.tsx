"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { capitalCase } from "change-case"
import { useQueryStates } from "nuqs"
import plur from "plur"
import { ToolStatus } from "~/.generated/prisma/browser"
import { AdminTableToolbar, NewEntityButton } from "~/components/app/admin-table"
import { ToolActions } from "~/components/app/tools/tool-actions"
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
import { ToolVerifiedBadge } from "~/components/web/tools/tool-verified-badge"
import { tiersConfig } from "~/config/tiers"
import { toolStatusConfig } from "~/config/tool-statuses"
import { useCan } from "~/contexts/user-context"
import { useDataTable } from "~/hooks/use-data-table"
import { orpc } from "~/lib/orpc-query"
import type { ToolWithOwner } from "~/server/tools/payloads"
import { toolListParams } from "~/server/tools/schema"
import type { DataTableFilterField } from "~/types"

const columns: ColumnDef<ToolWithOwner>[] = [
  createSelectColumn<ToolWithOwner>(),
  createNameColumn<ToolWithOwner>({
    title: "Name",
    href: row => `/app/tools/${row.id}`,
    image: row => row.faviconUrl,
    badge: row => <ToolVerifiedBadge tool={row} size="sm" className="pointer-events-none" />,
  }),
  {
    accessorKey: "tagline",
    enableSorting: false,
    size: 320,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tagline" />,
    cell: ({ row }) => (
      <Note title={row.original.tagline ?? undefined} className="truncate">
        {row.original.tagline}
      </Note>
    ),
  },
  {
    id: "owner",
    accessorFn: row => row.owner?.email,
    enableSorting: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
    cell: ({ row }) => <Note>{row.original.owner?.email}</Note>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge {...toolStatusConfig[row.original.status].badge}>{row.original.status}</Badge>
    ),
  },
  {
    accessorKey: "tier",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tier" />,
    cell: ({ row }) => <Badge {...tiersConfig[row.original.tier].badge}>{row.original.tier}</Badge>,
  },
  createDateColumn<ToolWithOwner>("publishedAt", "Published At"),
  createDateColumn<ToolWithOwner>("createdAt", "Created At"),
  createActionsColumn<ToolWithOwner>(tool => <ToolActions tool={tool} className="float-right" />),
]

export function ToolTable() {
  const canDelete = useCan("tools.delete")
  const [params, setParams] = useQueryStates(toolListParams)

  const { data, isLoading, isFetching } = useQuery(
    orpc.tools.list.queryOptions({
      input: params,
      placeholderData: keepPreviousData,
    }),
  )

  const filterFields: DataTableFilterField<ToolWithOwner>[] = [
    {
      id: "name",
      label: "Name",
    },
    {
      id: "status",
      label: "Status",
      variant: "tabs",
      options: Object.values(ToolStatus).map(status => ({
        label: capitalCase(status),
        value: status,
      })),
      defaultValue: toolListParams.status.defaultValue,
    },
  ]

  const { table } = useDataTable({
    data: data?.tools ?? [],
    columns,
    pageCount: data?.pageCount ?? 0,
    filterFields,
    initialState: {
      pagination: { pageIndex: 0, pageSize: params.perPage },
      sorting: params.sort,
      columnVisibility: { owner: false, tier: false, createdAt: false },
      columnPinning: { right: ["actions"] },
    },
    getRowId: row => row.id,
  })

  return (
    <DataTable table={table} isLoading={isLoading} isFetching={isFetching && !isLoading}>
      <DataTableHeader
        title="Tools"
        total={data?.total}
        callToAction={<NewEntityButton href="/app/tools/new">New tool</NewEntityButton>}
      >
        <AdminTableToolbar
          table={table}
          filterFields={filterFields}
          listParams={toolListParams}
          params={params}
          setParams={setParams}
          deleteDialog={
            canDelete && (
              <DataTableDeleteDialog
                table={table}
                label="tool"
                mutationOptions={orpc.tools.remove.mutationOptions}
                queryKey={orpc.tools.key()}
                description={rows => (
                  <>
                    This action cannot be undone.{" "}
                    <strong className="whitespace-nowrap">
                      {rows.length} {plur("tool", rows.length)}
                    </strong>{" "}
                    will be permanently deleted from the database along with their media.
                  </>
                )}
              />
            )
          }
        />
      </DataTableHeader>
    </DataTable>
  )
}
