"use client"

import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { FilteredListing } from "~/components/web/filters/filtered-listing"
import { ToolFilters } from "~/components/web/tools/tool-filters"
import { toolFilterParams, toolSort } from "~/server/tools/schema"

interface ToolListingProps extends Omit<
  ComponentProps<typeof FilteredListing>,
  "schema" | "placeholder" | "sortOptions" | "relevanceLabel" | "filters"
> {
  placeholder?: string
}

export function ToolListing({ placeholder, ...props }: ToolListingProps) {
  const t = useTranslations("tools.filters")

  const sortOptions = Object.entries(toolSort.options).map(([value, { label }]) => ({
    value,
    label: t(label),
  }))

  return (
    <FilteredListing
      id="tools"
      schema={toolFilterParams}
      placeholder={placeholder ?? t("search_placeholder")}
      sortOptions={sortOptions}
      relevanceLabel={t("sort_relevance")}
      filters={<ToolFilters />}
      {...props}
    />
  )
}
