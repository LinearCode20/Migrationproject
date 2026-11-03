"use client"

import { useTranslations } from "next-intl"
import type { ComponentProps, ReactNode } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/common/select"
import { useFilters } from "~/contexts/filter-context"

interface SortProps extends ComponentProps<typeof Select> {
  options: { label: ReactNode; value: string }[]

  /**
   * Label for the default order while a search query is active, for listings whose
   * search results default to relevance order.
   */
  relevanceLabel?: ReactNode
}

export function Sort({ options, relevanceLabel, ...props }: SortProps) {
  const t = useTranslations("common")
  const { filters, updateFilters } = useFilters()
  const hasQuery = Boolean(filters.q?.trim())
  const defaultLabel = hasQuery && relevanceLabel ? relevanceLabel : t("order_by")

  const items: { label: ReactNode; value: string | null }[] = [
    { label: defaultLabel, value: null },
    ...options,
  ]

  return (
    <Select
      value={filters.sort || null}
      items={items}
      onValueChange={sort => updateFilters({ sort })}
      {...props}
    >
      <SelectTrigger size="lg" className="w-auto min-w-36 max-sm:flex-1">
        <SelectValue />
      </SelectTrigger>

      <SelectContent align="end">
        {items.map(item => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
