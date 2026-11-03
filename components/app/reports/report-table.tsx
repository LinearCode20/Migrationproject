"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { capitalCase } from "change-case"
import { useQueryStates } from "nuqs"
import { ReportType } from "~/.generated/prisma/browser"
import { AdminTableToolbar } from "~/components/app/admin-table"
import { ReportActions } from "~/components/app/reports/report-actions"
import { Badge } from "~/components/common/badge"
import { Note } from "~/components/common/note"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import {
  createActionsColumn,
  createDateColumn,
  createSelectColumn,
} from "~/components/data-table/data-table-column-helpers"
import { DataTableDeleteDialog } from "~/components/data-table/data-table-delete-dialog"
import { DataTableHeader } from "~/components/data-table/data-table-header"
import { DataTableLink } from "~/components/data-table/data-table-link"
import { formatReportId } from "~/config/reports"
import { useCan } from "~/contexts/user-context"
import { useDataTable } from "~/hooks/use-data-table"
import { orpc } from "~/lib/orpc-query"
import type { findReports } from "~/server/reports/queries"
import { reportListParams } from "~/server/reports/schema"
import type { DataTableFilterField } from "~/types"

type ReportRow = Awaited<ReturnType<typeof findReports>>["reports"][number]

const columns: ColumnDef<ReportRow>[] = [
  createSelectColumn<ReportRow>(),
  {
    accessorKey: "id",
    enableSorting: false,
    enableHiding: false,
    size: 100,
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => (
      <DataTableLink
        href={`/app/reports/${row.original.id}`}
        title={formatReportId(row.original.id)}
        className="font-mono"
      />
    ),
  },
  {
    accessorKey: "message",
    enableSorting: false,
    size: 320,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Message" />,
    cell: ({ row }) => (
      <Note title={row.original.message ?? undefined} className="truncate">
        {row.original.message}
      </Note>
    ),
  },
  createDateColumn<ReportRow>("createdAt", "Reported At"),
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <Badge variant="outline">{capitalCase(row.getValue("type"))}</Badge>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <Note>{row.getValue("email")}</Note>,
  },
  {
    accessorKey: "tool",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tool" />,
    cell: ({ row }) => {
      const { tool } = row.original

      if (!tool) {
        return <Note>-</Note>
      }

      return <DataTableLink href={`/app/tools/${tool.id}`} title={tool.name} isOverlay={false} />
    },
  },
  createActionsColumn<ReportRow>(report => (
    <ReportActions report={report} className="float-right" />
  )),
]

export function ReportTable() {
  const canDelete = useCan("reports.delete")
  const [params, setParams] = useQueryStates(reportListParams)

  const { data, isLoading, isFetching } = useQuery(
    orpc.reports.list.queryOptions({
      input: params,
      placeholderData: keepPreviousData,
    }),
  )

  const filterFields: DataTableFilterField<ReportRow>[] = [
    {
      id: "message",
      label: "Message",
    },
    {
      id: "type",
      label: "Type",
      variant: "tabs",
      options: Object.values(ReportType).map(type => ({
        label: capitalCase(type),
        value: type,
      })),
    },
  ]

  const { table } = useDataTable({
    data: data?.reports ?? [],
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
      <DataTableHeader title="Reports" total={data?.total}>
        <AdminTableToolbar
          table={table}
          filterFields={filterFields}
          listParams={reportListParams}
          params={params}
          setParams={setParams}
          deleteDialog={
            canDelete && (
              <DataTableDeleteDialog
                table={table}
                label="report"
                mutationOptions={orpc.reports.remove.mutationOptions}
                queryKey={orpc.reports.key()}
              />
            )
          }
        />
      </DataTableHeader>
    </DataTable>
  )
}
