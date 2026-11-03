"use client"

import { PlusIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { Button } from "~/components/common/button"
import { EmptyList } from "~/components/web/empty-list"
import { useFilters } from "~/contexts/filter-context"
import type { ToolFilterSchema } from "~/server/tools/schema"

/**
 * Empty state for a tool listing. With filters active, it names the query and
 * offers a reset. Without them, it invites a submission. It reads the filters,
 * so it must render inside a `FiltersProvider`.
 */
export function ToolListEmpty() {
  const t = useTranslations("tools")
  const { filters, isDefault, updateFilters } = useFilters<ToolFilterSchema>()
  const query = filters.q.trim()

  if (isDefault) {
    return (
      <div className="col-span-full flex flex-col items-start gap-3">
        <EmptyList>{t("no_tools")}</EmptyList>

        <Button size="md" prefix={<PlusIcon />} render={<Link href="/submit" />}>
          {t("submit_tool")}
        </Button>
      </div>
    )
  }

  return (
    <div className="col-span-full flex flex-col items-start gap-3">
      <EmptyList>{query ? t("no_tools_query", { query }) : t("no_tools_filters")}</EmptyList>

      <Button variant="secondary" size="md" onClick={() => updateFilters(null)}>
        {t("reset_filters")}
      </Button>
    </div>
  )
}
