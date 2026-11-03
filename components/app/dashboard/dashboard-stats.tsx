"use client"

import { useQuery } from "@tanstack/react-query"
import { metricsStaleTime } from "~/components/app/dashboard/dashboard-metrics"
import { MetricValue, MetricValueSkeleton } from "~/components/app/metrics/metric-value"
import { orpc } from "~/lib/orpc-query"

export function DashboardStats() {
  const { data: stats } = useQuery(orpc.metrics.stats.queryOptions({ staleTime: metricsStaleTime }))

  if (!stats) {
    return (
      <>
        <MetricValueSkeleton />
        <MetricValueSkeleton />
        <MetricValueSkeleton />
      </>
    )
  }

  const counters = [
    { label: "Tools", href: "/app/tools", count: stats.toolCount },
    { label: "Categories", href: "/app/categories", count: stats.categoryCount },
    { label: "Users", href: "/app/users", count: stats.userCount },
  ]

  return (
    <>
      {counters.map(counter => (
        <MetricValue key={counter.label} {...counter} />
      ))}
    </>
  )
}
