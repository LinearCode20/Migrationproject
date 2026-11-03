"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useQueryStates } from "nuqs"
import { DashboardTable } from "~/components/app/dashboard/dashboard-table"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { orpc } from "~/lib/orpc-query"
import { toolListParams } from "~/server/tools/schema"

/**
 * The signed-in user's own submitted/owned tools for the dashboard landing.
 */
export function DashboardToolListing() {
  const [params] = useQueryStates(toolListParams)
  const { data } = useQuery(
    orpc.tools.dashboardList.queryOptions({ input: params, placeholderData: keepPreviousData }),
  )

  if (!data) {
    return <DataTableSkeleton />
  }

  return <DashboardTable {...data} />
}
