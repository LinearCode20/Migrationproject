"use client"

import type { ComponentProps, ReactNode } from "react"
import { Filters } from "~/components/web/filters/filters"
import { Sort } from "~/components/web/filters/sort"
import { Pagination } from "~/components/web/pagination"
import { FiltersProvider, type FiltersProviderProps, useFilters } from "~/contexts/filter-context"
import { cx } from "~/lib/utils"

interface FilteredListingSearchProps {
  placeholder: string
  sortOptions: ComponentProps<typeof Sort>["options"]
  relevanceLabel?: ComponentProps<typeof Sort>["relevanceLabel"]
  filters?: ReactNode
}

function FilteredListingSearch({
  placeholder,
  sortOptions,
  relevanceLabel,
  filters,
}: FilteredListingSearchProps) {
  const { enableSort, enableFilters } = useFilters()

  return (
    <Filters placeholder={placeholder}>
      {enableFilters && filters}
      {enableSort && <Sort options={sortOptions} relevanceLabel={relevanceLabel} />}
    </Filters>
  )
}

interface FilteredListingProps extends ComponentProps<"div">, FilteredListingSearchProps {
  schema: FiltersProviderProps["schema"]
  options?: Omit<FiltersProviderProps, "schema">
  pagination: ComponentProps<typeof Pagination>
}

/**
 * Search bar, results and pagination for a URL-filtered public listing. Each
 * entity wraps it in a client component that supplies its own filter schema.
 */
export function FilteredListing({
  children,
  className,
  schema,
  options,
  pagination,
  placeholder,
  sortOptions,
  relevanceLabel,
  filters,
  ...props
}: FilteredListingProps) {
  return (
    <FiltersProvider schema={schema} {...options}>
      <div className={cx("space-y-5", className)} {...props}>
        <FilteredListingSearch
          placeholder={placeholder}
          sortOptions={sortOptions}
          relevanceLabel={relevanceLabel}
          filters={filters}
        />

        {children}
      </div>

      <Pagination {...pagination} />
    </FiltersProvider>
  )
}
