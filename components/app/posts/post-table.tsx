"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { capitalCase } from "change-case"
import { useQueryStates } from "nuqs"
import { PostStatus } from "~/.generated/prisma/browser"
import { AdminTableToolbar, NewEntityButton } from "~/components/app/admin-table"
import { PostActions } from "~/components/app/posts/post-actions"
import { Badge } from "~/components/common/badge"
import { Note } from "~/components/common/note"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import {
  createActionsColumn,
  createDateColumn,
  createNameColumn,
  createSelectColumn,
} from "~/components/data-table/data-table-column-helpers"
import { DataTableDeleteDialog } from "~/components/data-table/data-table-delete-dialog"
import { DataTableHeader } from "~/components/data-table/data-table-header"
import { postStatusConfig } from "~/config/post-statuses"
import { useCan } from "~/contexts/user-context"
import { useDataTable } from "~/hooks/use-data-table"
import { orpc } from "~/lib/orpc-query"
import type { findPosts } from "~/server/posts/queries"
import { postListParams } from "~/server/posts/schema"
import type { DataTableFilterField } from "~/types"

type PostRow = Awaited<ReturnType<typeof findPosts>>["posts"][number]

const columns: ColumnDef<PostRow>[] = [
  createSelectColumn<PostRow>(),
  createNameColumn<PostRow>({
    title: "Title",
    key: "title",
    href: row => `/app/posts/${row.id}`,
    size: 240,
  }),
  {
    accessorKey: "author",
    enableSorting: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Author" />,
    cell: ({ row }) => (
      <Note title={row.original.author.name} className="max-w-24 truncate">
        {row.original.author.name}
      </Note>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge {...postStatusConfig[row.original.status].badge}>{row.original.status}</Badge>
    ),
  },
  createDateColumn<PostRow>("publishedAt", "Published At"),
  createDateColumn<PostRow>("createdAt", "Created At"),
  createActionsColumn<PostRow>(post => <PostActions post={post} className="float-right" />),
]

export function PostTable() {
  const canDelete = useCan("posts.delete")
  const [params, setParams] = useQueryStates(postListParams)

  const { data, isLoading, isFetching } = useQuery(
    orpc.posts.list.queryOptions({
      input: params,
      placeholderData: keepPreviousData,
    }),
  )

  const filterFields: DataTableFilterField<PostRow>[] = [
    {
      id: "title",
      label: "Title",
    },
    {
      id: "status",
      label: "Status",
      variant: "tabs",
      options: Object.values(PostStatus).map(status => ({
        label: capitalCase(status),
        value: status,
      })),
    },
  ]

  const { table } = useDataTable({
    data: data?.posts ?? [],
    columns,
    pageCount: data?.pageCount ?? 0,
    filterFields,
    initialState: {
      pagination: { pageIndex: 0, pageSize: params.perPage },
      sorting: params.sort,
      columnVisibility: { createdAt: false },
      columnPinning: { right: ["actions"] },
    },
    getRowId: row => row.id,
  })

  return (
    <DataTable table={table} isLoading={isLoading} isFetching={isFetching && !isLoading}>
      <DataTableHeader
        title="Blog Posts"
        total={data?.total}
        callToAction={<NewEntityButton href="/app/posts/new">New post</NewEntityButton>}
      >
        <AdminTableToolbar
          table={table}
          filterFields={filterFields}
          listParams={postListParams}
          params={params}
          setParams={setParams}
          deleteDialog={
            canDelete && (
              <DataTableDeleteDialog
                table={table}
                label="post"
                mutationOptions={orpc.posts.remove.mutationOptions}
                queryKey={orpc.posts.key()}
              />
            )
          }
        />
      </DataTableHeader>
    </DataTable>
  )
}
