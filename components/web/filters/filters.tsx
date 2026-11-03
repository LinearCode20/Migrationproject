"use client"

import { useDebouncedCallback } from "@mantine/hooks"
import { LoaderIcon, SearchIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { type ComponentProps, useState } from "react"
import { Button } from "~/components/common/button"
import { Input } from "~/components/common/input"
import { Stack } from "~/components/common/stack"
import { useFilters } from "~/contexts/filter-context"
import { cx } from "~/lib/utils"

interface FiltersProps extends ComponentProps<typeof Stack> {
  placeholder: string
}

export function Filters({ children, className, placeholder, ...props }: FiltersProps) {
  const t = useTranslations("common")
  const { filters, isLoading, isDefault, updateFilters } = useFilters()
  const currentQuery: string = filters.q ?? ""
  const [query, setQuery] = useState(currentQuery)
  const [previousQuery, setPreviousQuery] = useState(currentQuery)

  // Syncs the input when the `q` param changes outside of typing, such as on a reset.
  if (currentQuery !== previousQuery) {
    setPreviousQuery(currentQuery)
    setQuery(currentQuery)
  }

  const debouncedUpdateQuery = useDebouncedCallback((value: string) => {
    updateFilters({ q: value })
  }, 250)

  return (
    <Stack className={cx("w-full gap-2", className)} {...props}>
      <div className="relative grow min-w-0">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none">
          {isLoading ? <LoaderIcon className="animate-spin" /> : <SearchIcon />}
        </div>

        <Input
          size="lg"
          value={query}
          placeholder={isLoading ? t("loading") : placeholder}
          aria-label={placeholder}
          className={cx("w-full truncate pl-10", !isDefault && "pr-12 sm:pr-20")}
          onChange={event => {
            setQuery(event.target.value)
            debouncedUpdateQuery(event.target.value)
          }}
        />

        {!isDefault && (
          <Button
            variant="ghost"
            size="sm"
            prefix={<XIcon />}
            className="absolute right-2 inset-y-2"
            onClick={() => updateFilters(null)}
          >
            <span className="max-md:sr-only">{t("reset")}</span>
          </Button>
        )}
      </div>

      {children}
    </Stack>
  )
}
