"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { PlusIcon, SparklesIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useQueryStates } from "nuqs"
import { useMemo } from "react"
import type { Tool } from "~/.generated/prisma/browser"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import {
  createActionsColumn,
  createDateColumn,
  createNameColumn,
} from "~/components/data-table/data-table-column-helpers"
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar"
import { toolStatusConfig } from "~/config/tool-statuses"
import { useDataTable } from "~/hooks/use-data-table"
import { isToolTopTier } from "~/lib/tools"
import type { findTools } from "~/server/tools/queries"
import { toolListParams } from "~/server/tools/schema"
import type { DataTableFilterField } from "~/types"

export function DashboardTable({ tools, pageCount }: Awaited<ReturnType<typeof findTools>>) {
  const t = useTranslations("pages.dashboard.table")
  const [{ perPage, sort }] = useQueryStates(toolListParams)

  const columns = useMemo(
    (): ColumnDef<Tool>[] => [
      createNameColumn<Tool>({
        title: t("columns.name"),
        href: row => `/${row.slug}`,
        image: row => row.faviconUrl,
      }),
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("columns.status")} />
        ),
        cell: ({ row }) => (
          <Badge {...toolStatusConfig[row.original.status].badge}>{row.original.status}</Badge>
        ),
      },
      createDateColumn<Tool>("publishedAt", t("columns.published_at")),
      createActionsColumn<Tool>(tool => {
        if (isToolTopTier(tool)) {
          return null
        }

        return (
          <Button
            size="sm"
            variant="secondary"
            prefix={<SparklesIcon className="text-primary!" />}
            render={<Link href={`/submit/${tool.slug}`} />}
            className="float-right -my-1"
          >
            {t("tools.upgrade_button")}
          </Button>
        )
      }),
    ],
    [],
  )

  const filterFields: DataTableFilterField<Tool>[] = [
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
    getRowId: originalRow => originalRow.slug,
  })

  return (
    <DataTable table={table} emptyState={t("tools.empty_state")}>
      <DataTableToolbar table={table} filterFields={filterFields}>
        <Button size="md" variant="primary" prefix={<PlusIcon />} render={<Link href="/submit" />}>
          {t("tools.submit_button")}
        </Button>
      </DataTableToolbar>
    </DataTable>
  )
}
