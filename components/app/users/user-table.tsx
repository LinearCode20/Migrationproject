"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { useQueryStates } from "nuqs"
import type { ComponentProps } from "react"
import type { User } from "~/.generated/prisma/browser"
import { AdminTableToolbar } from "~/components/app/admin-table"
import { UserActions } from "~/components/app/users/user-actions"
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
import { useCan } from "~/contexts/user-context"
import { useDataTable } from "~/hooks/use-data-table"
import { orpc } from "~/lib/orpc-query"
import { userListParams, type userRoles } from "~/server/users/schema"
import type { DataTableFilterField } from "~/types"

type UserRole = (typeof userRoles)[number]

const roleBadges: Record<UserRole, ComponentProps<typeof Badge>> = {
  admin: { variant: "info", className: "capitalize" },
  user: { variant: "outline", className: "capitalize" },
}

const columns: ColumnDef<User>[] = [
  createSelectColumn<User>({ isDisabled: row => row.original.role === "admin" }),
  createNameColumn<User>({
    title: "Name",
    href: row => `/app/users/${row.id}`,
    getTitle: row => row.name || row.email,
  }),
  {
    accessorKey: "email",
    enableSorting: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <Note>{row.getValue("email")}</Note>,
  },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => {
      const role = row.getValue<UserRole>("role")

      if (row.original.banned) {
        return <Badge variant="danger">Banned</Badge>
      }

      return <Badge {...roleBadges[role]}>{role}</Badge>
    },
  },
  createDateColumn<User>("createdAt", "Created At"),
  createActionsColumn<User>(user => <UserActions user={user} className="float-right" />),
]

export function UserTable() {
  const canDelete = useCan("users.delete")
  const [params, setParams] = useQueryStates(userListParams)

  const { data, isLoading, isFetching } = useQuery(
    orpc.users.list.queryOptions({
      input: params,
      placeholderData: keepPreviousData,
    }),
  )

  const filterFields: DataTableFilterField<User>[] = [
    {
      id: "name",
      label: "Name",
    },
  ]

  const { table } = useDataTable({
    data: data?.users ?? [],
    columns,
    pageCount: data?.pageCount ?? 0,
    filterFields,
    initialState: {
      pagination: { pageIndex: 0, pageSize: params.perPage },
      sorting: params.sort,
      columnPinning: { right: ["actions"] },
    },
    getRowId: row => row.id,
    enableRowSelection: row => row.original.role !== "admin",
  })

  return (
    <DataTable table={table} isLoading={isLoading} isFetching={isFetching && !isLoading}>
      <DataTableHeader title="Users" total={data?.total}>
        <AdminTableToolbar
          table={table}
          filterFields={filterFields}
          listParams={userListParams}
          params={params}
          setParams={setParams}
          deleteDialog={
            canDelete && (
              <DataTableDeleteDialog
                table={table}
                label="user"
                mutationOptions={orpc.users.remove.mutationOptions}
                queryKey={orpc.users.key()}
              />
            )
          }
        />
      </DataTableHeader>
    </DataTable>
  )
}
