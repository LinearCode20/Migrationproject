"use client"

import { useQueryStates, type UseQueryStatesKeysMap, type Values } from "nuqs"
import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useMemo,
  useTransition,
} from "react"
import { isDefaultState } from "~/lib/parsers"

interface FiltersContextType<T extends UseQueryStatesKeysMap> {
  filters: Values<T>
  isLoading: boolean
  isDefault: boolean
  enableSort: boolean
  enableFilters: boolean
  updateFilters: (values: Partial<Values<T>> | null) => void
}

// The context is shared by providers of any schema, so it cannot carry `T`.
// oxlint-disable-next-line typescript/no-explicit-any
const FiltersContext = createContext<FiltersContextType<any>>(null!)

export interface FiltersProviderProps<T extends UseQueryStatesKeysMap = UseQueryStatesKeysMap> {
  schema: T
  enableSort?: boolean
  enableFilters?: boolean
}

export function FiltersProvider<T extends UseQueryStatesKeysMap>({
  children,
  schema,
  enableSort = true,
  enableFilters = false,
}: PropsWithChildren<FiltersProviderProps<T>>) {
  const [isLoading, startTransition] = useTransition()

  const [filters, setFilters] = useQueryStates(schema, {
    shallow: false,
    history: "push",
    startTransition,
  })

  // The generic nuqs key map does not satisfy the `ParserMap` that `isDefaultState` expects.
  // oxlint-disable-next-line typescript/no-explicit-any
  const isDefault = isDefaultState(schema as any, filters, ["page", "perPage"])

  const updateFilters = useCallback(
    (values: Partial<Values<T>> | null) => {
      if (values === null) {
        setFilters(null)
        return
      }

      // Typing a query replaces the history entry, so each debounced keystroke does
      // not become a step for the Back button. Other filter changes push a new entry.
      const isQueryOnly = Object.keys(values).every(key => key === "q")

      setFilters(previous => ({ ...previous, ...values, page: null }), {
        history: isQueryOnly ? "replace" : "push",
      })
    },
    [setFilters],
  )

  const contextValue = useMemo(
    () => ({ filters, isLoading, isDefault, updateFilters, enableSort, enableFilters }),
    [filters, isLoading, isDefault, updateFilters, enableSort, enableFilters],
  )

  return <FiltersContext.Provider value={contextValue}>{children}</FiltersContext.Provider>
}

export function useFilters<T extends UseQueryStatesKeysMap>(): FiltersContextType<T> {
  const context = use(FiltersContext)

  if (context === undefined) {
    throw new Error("useFilters must be used within a FiltersProvider")
  }

  return context
}
