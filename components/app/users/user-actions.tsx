"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import type { User } from "~/.generated/prisma/browser"
import { ActionsMenu, ActionsMenuDelete, ActionsMenuEdit } from "~/components/app/actions-menu"
import { ConfirmDialog } from "~/components/app/dialogs/confirm-dialog"
import {
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "~/components/common/dropdown-menu"
import { useCan } from "~/contexts/user-context"
import { admin, useSession } from "~/lib/auth-client"
import { orpc } from "~/lib/orpc-query"
import { userRoleSchema, userRoles } from "~/server/users/schema"

type AdminRequest = Promise<{ error: { message?: string } | null }>

/** Better Auth client calls resolve with an `error` instead of throwing, `toast.promise` needs a rejection. */
async function throwOnError(request: AdminRequest) {
  const { error } = await request

  if (error) {
    throw new Error(error.message ?? "Something went wrong")
  }
}

interface UserActionsProps extends ComponentProps<typeof ActionsMenu> {
  user: User
}

export function UserActions({ user, ...props }: UserActionsProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const canUpdate = useCan("users.update")
  const canDelete = useCan("users.delete")
  const entity = { indexPath: "/app/users", id: user.id }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: orpc.users.key() })
    router.refresh()
  }

  const updateRoleMutation = useMutation(
    orpc.users.updateRole.mutationOptions({ onSuccess: refresh }),
  )

  function runAdminAction(
    request: () => AdminRequest,
    messages: { loading: string; success: string },
  ) {
    const promise = throwOnError(request()).then(refresh)
    toast.promise(promise, { ...messages, error: error => error.message })
    return promise
  }

  if (user.id === session?.user.id) {
    return null
  }

  return (
    <ActionsMenu {...props}>
      <ActionsMenuEdit {...entity} />

      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={!canUpdate}>Role</DropdownMenuSubTrigger>

        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={user.role}
            onValueChange={value => {
              toast.promise(
                updateRoleMutation.mutateAsync({ id: user.id, role: userRoleSchema.parse(value) }),
                {
                  loading: "Updating...",
                  success: "Role successfully updated",
                  error: error => error.message,
                },
              )
            }}
          >
            {userRoles.map(role => (
              <DropdownMenuRadioItem
                key={role}
                value={role}
                disabled={updateRoleMutation.isPending}
                className="capitalize"
              >
                {role}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      {user.role !== "admin" &&
        (user.banned ? (
          <DropdownMenuItem
            disabled={!canUpdate}
            onClick={() =>
              runAdminAction(() => admin.unbanUser({ userId: user.id }), {
                loading: "Unbanning...",
                success: "User successfully unbanned",
              })
            }
          >
            Unban
          </DropdownMenuItem>
        ) : (
          <ConfirmDialog
            title="Ban this user?"
            description={
              <>
                <strong>{user.name || user.email}</strong> will not be able to sign in until
                unbanned.
              </>
            }
            confirmLabel="Ban user"
            variant="destructive"
            onConfirm={() =>
              runAdminAction(() => admin.banUser({ userId: user.id }), {
                loading: "Banning...",
                success: "User successfully banned",
              })
            }
          >
            <DropdownMenuItem disabled={!canUpdate} closeOnClick={false}>
              Ban
            </DropdownMenuItem>
          </ConfirmDialog>
        ))}

      <ConfirmDialog
        title="Revoke all sessions?"
        description={
          <>
            <strong>{user.name || user.email}</strong> will be signed out on every device.
          </>
        }
        confirmLabel="Revoke sessions"
        variant="destructive"
        onConfirm={() =>
          runAdminAction(() => admin.revokeUserSessions({ userId: user.id }), {
            loading: "Revoking sessions...",
            success: "Sessions successfully revoked",
          })
        }
      >
        <DropdownMenuItem disabled={!canUpdate} closeOnClick={false}>
          Revoke Sessions
        </DropdownMenuItem>
      </ConfirmDialog>

      {user.role !== "admin" && (
        <>
          <DropdownMenuSeparator />
          <ActionsMenuDelete
            {...entity}
            label="user"
            disabled={!canDelete}
            mutationOptions={orpc.users.remove.mutationOptions}
            queryKey={orpc.users.key()}
          />
        </>
      )}
    </ActionsMenu>
  )
}
