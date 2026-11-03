"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useQueryStates } from "nuqs"
import { BookmarkTable } from "~/components/app/bookmarks/bookmark-table"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { orpc } from "~/lib/orpc-query"
import { bookmarkListParams } from "~/server/bookmarks/schema"

/**
 * The signed-in user's bookmarked tools.
 */
export function BookmarkListing() {
  const [params] = useQueryStates(bookmarkListParams)
  const { data } = useQuery(
    orpc.bookmarks.list.queryOptions({ input: params, placeholderData: keepPreviousData }),
  )

  if (!data) {
    return <DataTableSkeleton />
  }

  return <BookmarkTable {...data} />
}
