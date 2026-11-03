import { formatNumber } from "@dirstack/utils"
import Link from "next/link"
import type { ComponentProps } from "react"
import { MetricHeader, MetricHeaderSkeleton } from "~/components/app/metrics/metric-header"
import { Card } from "~/components/common/card"

interface MetricValueProps extends ComponentProps<typeof Card> {
  label: string
  href: string
  count: number
}

export function MetricValue({ label, href, count, ...props }: MetricValueProps) {
  return (
    <Card render={<Link href={href} />} {...props}>
      <MetricHeader title={label} value={formatNumber(count)} />
    </Card>
  )
}

export function MetricValueSkeleton() {
  return (
    <Card>
      <MetricHeaderSkeleton />
    </Card>
  )
}
