"use client"

import type { Column } from "@tanstack/react-table"
import { PlusCircleIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import {
  Command,
  CommandCheckboxItem,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/common/command"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/common/popover"
import { Separator } from "~/components/common/separator"
import { slot } from "~/lib/slot"
import type { Option } from "~/types"

interface DataTableFacetedFilterProps<TData, TValue> {
  column: Column<TData, TValue>
  title?: string
  options: Option[]
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const t = useTranslations("components.data_table.faceted_filter")
  const selectedValues = new Set(column.getFilterValue() as string[])

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="secondary"
            size="md"
            prefix={<PlusCircleIcon />}
            className="border-dashed"
          />
        }
      >
        {title}
        {selectedValues.size > 0 && (
          <>
            <Separator orientation="vertical" className="mx-0.5 h-3.5" />

            <Badge className="-my-1 rounded lg:hidden">{selectedValues.size}</Badge>

            <div className="hidden space-x-1 lg:flex">
              {selectedValues.size > 2 ? (
                <Badge className="-my-1 rounded">
                  {selectedValues.size} {t("selected")}
                </Badge>
              ) : (
                options
                  .filter(option => selectedValues.has(option.value))
                  .map(option => (
                    <Badge key={option.value} className="-my-1 rounded">
                      {option.label}
                    </Badge>
                  ))
              )}
            </div>
          </>
        )}
      </PopoverTrigger>

      <PopoverContent align="start" className="p-0">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>{t("no_results")}</CommandEmpty>
            <CommandGroup>
              {options.map(option => {
                const isSelected = selectedValues.has(option.value)

                return (
                  <CommandCheckboxItem
                    key={option.value}
                    checked={isSelected}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value)
                      } else {
                        selectedValues.add(option.value)
                      }
                      const filterValues = Array.from(selectedValues)
                      column.setFilterValue(filterValues.length ? filterValues : undefined)
                    }}
                  >
                    {slot(option.icon, {
                      className: "-mr-0.5 stroke-[2.5]",
                      "aria-hidden": "true",
                    })}

                    <span>{option.label}</span>
                  </CommandCheckboxItem>
                )
              })}
            </CommandGroup>

            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    className="justify-center text-center"
                    onSelect={() => column.setFilterValue(undefined)}
                  >
                    {t("clear_filters")}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
