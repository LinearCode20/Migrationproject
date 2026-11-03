import { isPageOutOfRange } from "@dirstack/utils"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import type { SearchParams } from "nuqs"
import type { ComponentProps } from "react"
import type { Prisma } from "~/.generated/prisma/client"
import { AdGrid } from "~/components/web/ads/ad-grid"
import { StructuredData } from "~/components/web/structured-data"
import { ToolList } from "~/components/web/tools/tool-list"
import { ToolListEmpty } from "~/components/web/tools/tool-list-empty"
import { ToolListing } from "~/components/web/tools/tool-listing"
import { createGraph, generateItemList } from "~/lib/structured-data"
import { searchTools } from "~/server/tools/queries"
import { type ToolFilterParams, toolFilterParamsCache } from "~/server/tools/schema"

interface ToolQueryProps extends Pick<
  ComponentProps<typeof ToolListing>,
  "placeholder" | "options"
> {
  searchParams: Promise<SearchParams>
  overrideParams?: Partial<ToolFilterParams>
  where?: Prisma.ToolWhereInput
  /** Props for the tool grid, such as a custom column layout. */
  list?: Partial<Omit<ComponentProps<typeof ToolList>, "tools">>
  /** Name of the listing, used for its structured data item list. */
  name?: string
}

export async function ToolQuery({
  searchParams,
  overrideParams,
  where,
  list,
  name,
  placeholder,
  options,
}: ToolQueryProps) {
  // Request-time only. This query is skipped at build. See https://dirstarter.com/docs/codebase/caching.
  await connection()

  const parsedParams = toolFilterParamsCache.parse(await searchParams)
  const params = { ...parsedParams, ...overrideParams }
  const { tools, page, pageCount } = await searchTools(params, where)

  if (isPageOutOfRange(page, pageCount)) {
    notFound()
  }

  const items = tools.map(tool => ({
    name: tool.name,
    url: `/${tool.slug}`,
    description: tool.description,
  }))

  const structuredData = createGraph([generateItemList(items, name)])

  return (
    <ToolListing pagination={{ pageCount, page }} placeholder={placeholder} options={options}>
      <StructuredData data={structuredData} />

      <ToolList tools={tools} empty={<ToolListEmpty />} {...list}>
        <AdGrid count={tools.length} />
      </ToolList>
    </ToolListing>
  )
}
