import { useDebouncedCallback } from "@mantine/hooks"
import {
  type ColumnFiltersState,
  getCoreRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  type Updater,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  type SingleParser,
  useQueryState,
  useQueryStates,
} from "nuqs"
import { useMemo, useState } from "react"
import { getSortingStateParser } from "~/lib/parsers"
import type { DataTableFilterField, ExtendedSortingState } from "~/types"

interface UseDataTableProps<TData>
  extends
    Omit<
      TableOptions<TData>,
      | "state"
      | "pageCount"
      | "getCoreRowModel"
      | "manualFiltering"
      | "manualPagination"
      | "manualSorting"
    >,
    Required<Pick<TableOptions<TData>, "pageCount">> {
  /**
   * Filter fields for the table, synced with the URL query string.
   * - Fields with `options` render a faceted filter, or segmented tabs with `variant: "tabs"`.
   * - Fields without `options` render a search input.
   *
   * Each field `id` is both the column id and the query string key.
   * @default []
   * @example
   * ```ts
   * const filterFields = [
   *   { id: "name", label: "Name" },
   *   { id: "status", label: "Status", options: [{ label: "Draft", value: "draft" }] },
   * ]
   * ```
   */
  filterFields?: DataTableFilterField<TData>[]

  /**
   * Keep URL updates client-side. Pass `false` when the table data comes from a
   * Server Component, so a page, sort or filter change re-renders it.
   * @default true
   */
  shallow?: boolean

  initialState?: Omit<Partial<TableState>, "sorting"> & {
    // Narrows the sorting ids to the row keys.
    sorting?: ExtendedSortingState<TData>
  }
}

export function useDataTable<TData>({
  filterFields = [],
  shallow = true,
  initialState,
  ...props
}: UseDataTableProps<TData>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(
    initialState?.rowSelection ?? {},
  )
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialState?.columnVisibility ?? {},
  )

  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withOptions({ shallow }).withDefault(1),
  )
  const [perPage, setPerPage] = useQueryState(
    "perPage",
    parseAsInteger.withOptions({ shallow }).withDefault(initialState?.pagination?.pageSize ?? 25),
  )
  const [sorting, setSorting] = useQueryState(
    "sort",
    getSortingStateParser<TData>()
      .withOptions({ shallow })
      .withDefault(initialState?.sorting ?? []),
  )

  const filterParsers = useMemo(
    () =>
      filterFields.reduce<Record<string, SingleParser<string> | SingleParser<string[]>>>(
        (parsers, field) => {
          if (field.options) {
            const parser = parseAsArrayOf(parseAsString, ",")
            parsers[field.id] = Array.isArray(field.defaultValue)
              ? parser.withDefault(field.defaultValue)
              : parser
          } else {
            parsers[field.id] =
              typeof field.defaultValue === "string"
                ? parseAsString.withDefault(field.defaultValue)
                : parseAsString
          }
          return parsers
        },
        {},
      ),
    [filterFields],
  )

  const [filterValues, setFilterValues] = useQueryStates(filterParsers, { shallow })

  const debouncedSetFilterValues = useDebouncedCallback((values: typeof filterValues) => {
    void setPage(1)
    void setFilterValues(values)
  }, 250)

  const pagination: PaginationState = {
    pageIndex: page - 1, // The URL page is one-based, the table index is zero-based.
    pageSize: perPage,
  }

  function onPaginationChange(updaterOrValue: Updater<PaginationState>) {
    const newPagination =
      typeof updaterOrValue === "function" ? updaterOrValue(pagination) : updaterOrValue

    void setPage(newPagination.pageIndex + 1)

    if (newPagination.pageSize !== pagination.pageSize) {
      void setPerPage(newPagination.pageSize)
    }
  }

  function onSortingChange(updaterOrValue: Updater<SortingState>) {
    const newSorting =
      typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue

    void setSorting(newSorting as ExtendedSortingState<TData>)
  }

  const urlColumnFilters = useMemo(
    () =>
      Object.entries(filterValues).flatMap(([id, value]) =>
        value === null ? [] : [{ id, value: Array.isArray(value) ? value : [value] }],
      ),
    [filterValues],
  )

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(urlColumnFilters)
  const [syncedColumnFilters, setSyncedColumnFilters] = useState(urlColumnFilters)

  // Re-seed the local filters when the URL changes from outside the table (e.g. a
  // sidebar link that clears the query string without remounting), so the filter
  // controls never show a selection the data no longer reflects.
  // `urlColumnFilters` only changes identity with the filter params.
  if (syncedColumnFilters !== urlColumnFilters) {
    setSyncedColumnFilters(urlColumnFilters)
    setColumnFilters(urlColumnFilters)
  }

  function onColumnFiltersChange(updaterOrValue: Updater<ColumnFiltersState>) {
    setColumnFilters(previous => {
      const next = typeof updaterOrValue === "function" ? updaterOrValue(previous) : updaterOrValue

      const filterUpdates = next.reduce<Record<string, string | string[] | null>>(
        (updates, filter) => {
          if (filterFields.some(field => field.id === filter.id)) {
            updates[filter.id] = filter.value as string | string[]
          }
          return updates
        },
        {},
      )

      for (const previousFilter of previous) {
        if (!next.some(filter => filter.id === previousFilter.id)) {
          filterUpdates[previousFilter.id] = null
        }
      }

      debouncedSetFilterValues(filterUpdates)
      return next
    })
  }

  const table = useReactTable({
    ...props,
    initialState,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    defaultColumn: {
      size: 0,
      minSize: 0,
    },
    enableRowSelection: props.enableRowSelection ?? true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  })

  return { table }
}
