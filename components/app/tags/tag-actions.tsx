"use client"

import type { ComponentProps } from "react"
import type { Tag } from "~/.generated/prisma/browser"
import {
  ActionsMenu,
  ActionsMenuDelete,
  ActionsMenuDuplicate,
  ActionsMenuEdit,
  ActionsMenuView,
} from "~/components/app/actions-menu"
import { DropdownMenuSeparator } from "~/components/common/dropdown-menu"
import { useCan } from "~/contexts/user-context"
import { orpc } from "~/lib/orpc-query"

interface TagActionsProps extends ComponentProps<typeof ActionsMenu> {
  tag: Tag
}

export function TagActions({ tag, ...props }: TagActionsProps) {
  const canUpdate = useCan("tags.update")
  const canDelete = useCan("tags.delete")
  const entity = { indexPath: "/app/tags", id: tag.id, label: "tag", queryKey: orpc.tags.key() }

  return (
    <ActionsMenu {...props}>
      <ActionsMenuEdit {...entity} />
      <ActionsMenuView href={`/tags/${tag.slug}`} />
      <DropdownMenuSeparator />

      <ActionsMenuDuplicate
        {...entity}
        disabled={!canUpdate}
        mutationOptions={orpc.tags.duplicate.mutationOptions}
      />

      <DropdownMenuSeparator />

      <ActionsMenuDelete
        {...entity}
        disabled={!canDelete}
        mutationOptions={orpc.tags.remove.mutationOptions}
      />
    </ActionsMenu>
  )
}
