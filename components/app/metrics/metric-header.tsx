import type { ComponentProps, ReactNode } from "react"
import { CardDescription, CardHeader } from "~/components/common/card"
import { H2 } from "~/components/common/heading"
import { Skeleton } from "~/components/common/skeleton"

interface MetricHeaderProps extends Omit<ComponentProps<typeof CardHeader>, "title"> {
  title: ReactNode
  value: ReactNode
  note?: ReactNode
}

export function MetricHeader({ title, value, note }: MetricHeaderProps) {
  return (
    <CardHeader>
      <CardDescription className="w-auto">{title}</CardDescription>
      {note && <span className="ml-auto text-xs text-muted-foreground/50">{note}</span>}
      <H2 className="w-full">{value}</H2>
    </CardHeader>
  )
}

export function MetricHeaderSkeleton() {
  return (
    <CardHeader>
      <CardDescription>
        <Skeleton className="w-16">&nbsp;</Skeleton>
      </CardDescription>

      <H2 className="w-full">
        <Skeleton className="w-24">&nbsp;</Skeleton>
      </H2>
    </CardHeader>
  )
}
