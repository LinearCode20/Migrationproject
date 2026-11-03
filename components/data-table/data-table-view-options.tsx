"use client"

import type { Table } from "@tanstack/react-table"
import { sentenceCase } from "change-case"
import { ChevronsUpDown, Settings2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "~/components/common/button"
import {
  Command,
  CommandCheckboxItem,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "~/components/common/command"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/common/popover"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  const t = useTranslations("components.data_table.view_options")

  return (
    <Popover modal>
      <PopoverTrigger
        render={
          <Button
            variant="secondary"
            size="md"
            prefix={<Settings2 />}
            suffix={<ChevronsUpDown />}
            className="ml-auto max-md:hidden"
          />
        }
      >
        {t("view")}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-44 p-0">
        <Command>
          <CommandInput placeholder={t("search_columns")} />
          <CommandList>
            <CommandEmpty>{t("no_columns")}</CommandEmpty>
            <CommandGroup>
              {table
                .getAllColumns()
                .filter(column => typeof column.accessorFn !== "undefined" && column.getCanHide())
                .map(column => (
                  <CommandCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onSelect={() => column.toggleVisibility(!column.getIsVisible())}
                  >
                    <span className="truncate">{sentenceCase(column.id)}</span>
                  </CommandCheckboxItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
