"use client"

import { ucFirst } from "@dirstack/utils"
import { type UseMutationOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronDownIcon, CopyIcon, TrashIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import { DeleteDialog } from "~/components/app/dialogs/delete-dialog"
import { Button } from "~/components/common/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { cx } from "~/lib/utils"

/** Whether the current page is the edit page of the given entity. */
export function useIsSinglePage(indexPath: string, id: string) {
  return usePathname() === `${indexPath}/${id}`
}

interface EntityLocation {
  /** Admin index path of the entity, e.g. `/app/tools`. */
  indexPath: string
  id: string
}

export function ActionsMenu({ className, children, ...props }: ComponentProps<typeof Button>) {
  return (
    <DropdownMenu modal={false}>
      <Button
        variant="secondary"
        size="sm"
        suffix={<ChevronDownIcon />}
        render={<DropdownMenuTrigger />}
        className={cx("data-open:bg-accent", className)}
        {...props}
      >
        Actions
      </Button>

      <DropdownMenuContent align="end" sideOffset={8}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Links to the edit page, hidden when already on it. */
export function ActionsMenuEdit({ indexPath, id }: EntityLocation) {
  const isSinglePage = useIsSinglePage(indexPath, id)

  if (isSinglePage) {
    return null
  }

  return <DropdownMenuItem render={<Link href={`${indexPath}/${id}`} />}>Edit</DropdownMenuItem>
}

interface ActionsMenuViewProps {
  href: string
}

/** Opens the public page of the entity in a new tab. */
export function ActionsMenuView({ href }: ActionsMenuViewProps) {
  return <DropdownMenuItem render={<Link href={href} target="_blank" />}>View</DropdownMenuItem>
}

interface ActionsMenuDuplicateProps extends EntityLocation {
  label: string
  disabled?: boolean
  queryKey: readonly unknown[]
  mutationOptions: (options: {
    onSuccess: (data: { id: string }) => void
  }) => Pick<
    UseMutationOptions<{ id: string }, Error, { id: string }>,
    "mutationKey" | "mutationFn"
  >
}

/** Duplicates the entity and opens the copy when triggered from the edit page. */
export function ActionsMenuDuplicate({
  indexPath,
  id,
  label,
  disabled,
  queryKey,
  mutationOptions,
}: ActionsMenuDuplicateProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isSinglePage = useIsSinglePage(indexPath, id)

  const duplicateMutation = useMutation(
    mutationOptions({
      onSuccess: data => {
        queryClient.invalidateQueries({ queryKey })

        if (isSinglePage) {
          router.push(`${indexPath}/${data.id}`)
        }
      },
    }),
  )

  function handleDuplicate() {
    toast.promise(duplicateMutation.mutateAsync({ id }), {
      loading: `Duplicating ${label}...`,
      success: `${ucFirst(label)} duplicated successfully`,
      error: error => `Failed to duplicate ${label}: ${error.message}`,
    })
  }

  return (
    <DropdownMenuItem disabled={disabled} onClick={handleDuplicate}>
      <CopyIcon />
      Duplicate
    </DropdownMenuItem>
  )
}

interface ActionsMenuDeleteProps
  extends
    EntityLocation,
    Omit<ComponentProps<typeof DeleteDialog>, "children" | "ids" | "onExecute"> {
  disabled?: boolean
}

/** Deletes the entity and returns to the index when triggered from the edit page. */
export function ActionsMenuDelete({ indexPath, id, disabled, ...props }: ActionsMenuDeleteProps) {
  const router = useRouter()
  const isSinglePage = useIsSinglePage(indexPath, id)

  return (
    <DeleteDialog ids={[id]} onExecute={() => isSinglePage && router.push(indexPath)} {...props}>
      <DropdownMenuItem variant="destructive" disabled={disabled} closeOnClick={false}>
        <TrashIcon />
        Delete
      </DropdownMenuItem>
    </DeleteDialog>
  )
}
