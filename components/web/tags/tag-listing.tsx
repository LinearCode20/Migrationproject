"use client"

import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { FilteredListing } from "~/components/web/filters/filtered-listing"
import { TagFilters } from "~/components/web/tags/tag-filters"
import { cx } from "~/lib/utils"
import { tagFilterParams, tagSort } from "~/server/tags/schema"

type TagListingProps = Omit<
  ComponentProps<typeof FilteredListing>,
  "schema" | "placeholder" | "sortOptions" | "filters"
>

export function TagListing({ className, ...props }: TagListingProps) {
  const t = useTranslations("tags.filters")

  const sortOptions = Object.entries(tagSort.options).map(([value, { label }]) => ({
    value,
    label: t(label),
  }))

  return (
    <FilteredListing
      id="tags"
      schema={tagFilterParams}
      placeholder={t("search_placeholder")}
      sortOptions={sortOptions}
      // The letter grid spans a full row, so it sits below the search input and sort.
      filters={<TagFilters className="order-last" />}
      className={cx("space-y-10", className)}
      {...props}
    />
  )
}
