import type { ColumnSort } from "@tanstack/react-table"
import type { ReactNode } from "react"

type StringKeyOf<TData> = Extract<keyof TData, string>

export interface Option {
  label: string
  value: string
  icon?: ReactNode
}

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
  id: StringKeyOf<TData>
}

export type ExtendedSortingState<TData> = ExtendedColumnSort<TData>[]

export interface DataTableFilterField<TData> {
  id: StringKeyOf<TData>
  label: string
  options?: Option[]
  defaultValue?: string[] | string
  /** How an `options` filter renders: a multi-select dropdown (default) or single-select tabs. */
  variant?: "dropdown" | "tabs"
}
