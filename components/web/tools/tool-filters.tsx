"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import plur from "plur"
import type { ComponentProps } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/common/select"
import { useFilters } from "~/contexts/filter-context"
import { orpc } from "~/lib/orpc-query"
import type { ToolFilterSchema } from "~/server/tools/schema"

export function ToolFilters({ ...props }: ComponentProps<typeof Select>) {
  const t = useTranslations("tools.filters")
  const { filters, updateFilters } = useFilters<ToolFilterSchema>()
  const { data } = useQuery(orpc.tools.filterOptions.queryOptions())

  return (
    <>
      {data?.map(({ type, options }) => {
        const items = [
          { label: t(`all_${plur(type)}`), value: null },
          ...options.map(({ slug, name }) => ({ label: name, value: slug })),
        ]

        return (
          <Select
            key={type}
            value={filters[type] || null}
            items={items}
            onValueChange={value => updateFilters({ [type as keyof typeof filters]: value })}
            {...props}
          >
            <SelectTrigger size="lg" className="w-auto min-w-40 max-sm:flex-1">
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
      })}
    </>
  )
}
