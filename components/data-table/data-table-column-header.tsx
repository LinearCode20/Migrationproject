"use client"

import type { Column } from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, EyeOffIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { cva, cx } from "~/lib/utils"

const dataTableColumnHeaderVariants = cva({
  base: "text-start font-medium text-muted-foreground whitespace-nowrap",

  variants: {
    toggleable: {
      true: "flex items-center gap-1 hover:text-foreground data-open:text-foreground",
    },
  },
})

interface DataTableColumnHeaderProps<TData, TValue> extends ComponentProps<
  typeof DropdownMenuTrigger
> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  const t = useTranslations("components.data_table.column_header")

  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cx(dataTableColumnHeaderVariants(), className)}>{title}</div>
  }

  const sortDirection = column.getCanSort() && column.getIsSorted()

  const sortStates = {
    desc: [t("sorted_desc"), ArrowDownIcon],
    asc: [t("sorted_asc"), ArrowUpIcon],
  } as const

  const [sortLabel, SortIcon] = sortDirection
    ? sortStates[sortDirection]
    : [t("not_sorted"), ChevronsUpDownIcon]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cx(dataTableColumnHeaderVariants({ toggleable: true }), className)}
        {...props}
      >
        {title}
        {column.getCanSort() && <span className="sr-only">{sortLabel}</span>}
        <SortIcon aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        {column.getCanSort() && (
          <>
            <DropdownMenuItem
              aria-label={t("sort_asc")}
              onClick={() => column.toggleSorting(false)}
            >
              <ArrowUpIcon aria-hidden="true" className="mr-2 text-muted-foreground/70" />
              {t("asc")}
            </DropdownMenuItem>

            <DropdownMenuItem
              aria-label={t("sort_desc")}
              onClick={() => column.toggleSorting(true)}
            >
              <ArrowDownIcon aria-hidden="true" className="mr-2 text-muted-foreground/70" />
              {t("desc")}
            </DropdownMenuItem>
          </>
        )}
        {column.getCanSort() && column.getCanHide() && <DropdownMenuSeparator />}
        {column.getCanHide() && (
          <DropdownMenuItem
            aria-label={t("hide_column")}
            onClick={() => column.toggleVisibility(false)}
          >
            <EyeOffIcon aria-hidden="true" className="mr-2 text-muted-foreground/70" />
            {t("hide")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
