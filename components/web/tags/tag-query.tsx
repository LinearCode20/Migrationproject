import { isPageOutOfRange } from "@dirstack/utils"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import type { SearchParams } from "nuqs"
import type { ComponentProps } from "react"
import { TagListing } from "~/components/web/tags/tag-listing"
import { TaxonomyList } from "~/components/web/taxonomies/taxonomy-list"
import { isDefaultState } from "~/lib/parsers"
import { searchTags } from "~/server/tags/queries"
import { tagFilterParams, tagFilterParamsCache } from "~/server/tags/schema"

interface TagQueryProps extends Pick<ComponentProps<typeof TagListing>, "options"> {
  searchParams: Promise<SearchParams>
}

export async function TagQuery({ searchParams, options }: TagQueryProps) {
  // Request-time only. This query is skipped at build. See https://dirstarter.com/docs/codebase/caching.
  await connection()

  const t = await getTranslations("tags")
  const params = tagFilterParamsCache.parse(await searchParams)
  const { tags, page, pageCount } = await searchTags(params)

  if (isPageOutOfRange(page, pageCount)) {
    notFound()
  }

  const isFiltered = !isDefaultState(tagFilterParams, params, ["page", "sort"])

  const items = tags.map(({ slug, _count }) => ({
    href: `/tags/${slug}`,
    name: slug,
    count: _count.tools,
  }))

  return (
    <TagListing pagination={{ pageCount, page }} options={options}>
      <TaxonomyList items={items} emptyMessage={isFiltered ? t("no_tags_filters") : t("no_tags")} />
    </TagListing>
  )
}
