"use client"

import { SearchIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "~/components/common/button"
import { useSearch } from "~/contexts/search-context"

export function SearchButton() {
  const t = useTranslations("components.search")
  const search = useSearch()

  return (
    <Button
      size="sm"
      variant="ghost"
      aria-label={t("button_label")}
      className="p-1 text-base"
      onClick={search.open}
    >
      <SearchIcon />
    </Button>
  )
}
