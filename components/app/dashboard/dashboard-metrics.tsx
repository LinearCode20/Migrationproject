"use client"

import { formatCurrency, formatNumber, HOUR_MS } from "@dirstack/utils"
import { useQuery } from "@tanstack/react-query"
import type { ComponentProps } from "react"
import { Chart } from "~/components/app/chart"
import { MetricHeader, MetricHeaderSkeleton } from "~/components/app/metrics/metric-header"
import { MetricTrend } from "~/components/app/metrics/metric-trend"
import { Card } from "~/components/common/card"
import { Skeleton } from "~/components/common/skeleton"
import { orpc } from "~/lib/orpc-query"

/** Dashboard metrics change slowly, so they are cached for an hour. */
export const metricsStaleTime = HOUR_MS

interface MetricChartProps
  extends
    Omit<ComponentProps<typeof Chart>, "title">,
    Pick<ComponentProps<typeof MetricHeader>, "title" | "value"> {
  /** Change against the previous 30 days as a fraction, `null` when the data failed to load. */
  change: number | null
}

function MetricChart({ title, value, change, ...props }: MetricChartProps) {
  return (
    <Card>
      <MetricHeader
        title={title}
        value={
          <span className="flex items-baseline gap-2">
            {value}
            {change !== null && (
              <MetricTrend
                change={change}
                tooltip="Compared with the previous 30 days"
                className="text-sm"
              />
            )}
          </span>
        }
        note="last 30 days"
      />
      <Chart {...props} />
    </Card>
  )
}

function MetricChartSkeleton() {
  return (
    <Card>
      <MetricHeaderSkeleton />
      <Skeleton className="w-full h-30" />
    </Card>
  )
}

export function VisitorMetric() {
  const { data } = useQuery(orpc.metrics.visitors.queryOptions({ staleTime: metricsStaleTime }))

  if (!data) {
    return <MetricChartSkeleton />
  }

  return (
    <MetricChart
      title="Visitors"
      value={formatNumber(data.totalVisitors)}
      data={data.results}
      dataLabel="Visitor"
      change={data.visitorsChange}
      cellClassName="bg-chart-4"
    />
  )
}

export function RevenueMetric() {
  const { data } = useQuery(orpc.metrics.revenue.queryOptions({ staleTime: metricsStaleTime }))

  if (!data) {
    return <MetricChartSkeleton />
  }

  return (
    <MetricChart
      title="Revenue"
      value={formatCurrency(data.totalRevenue)}
      data={data.results}
      formatValue={formatCurrency}
      change={data.revenueChange}
      cellClassName="bg-chart-5"
    />
  )
}

export function UserMetric() {
  const { data } = useQuery(orpc.metrics.userMetric.queryOptions({ staleTime: metricsStaleTime }))

  if (!data) {
    return <MetricChartSkeleton />
  }

  return (
    <MetricChart
      title="New users"
      value={formatNumber(data.totalUsers)}
      data={data.results}
      dataLabel="New User"
      change={data.usersChange}
      cellClassName="bg-chart-1"
    />
  )
}
