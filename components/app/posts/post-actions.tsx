"use client"

import type { ComponentProps } from "react"
import type { Post } from "~/.generated/prisma/browser"
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

interface PostActionsProps extends ComponentProps<typeof ActionsMenu> {
  post: Post
}

export function PostActions({ post, ...props }: PostActionsProps) {
  const canUpdate = useCan("posts.update")
  const canDelete = useCan("posts.delete")
  const entity = { indexPath: "/app/posts", id: post.id, label: "post", queryKey: orpc.posts.key() }

  return (
    <ActionsMenu {...props}>
      <ActionsMenuEdit {...entity} />
      <ActionsMenuView href={`/blog/${post.slug}`} />
      <DropdownMenuSeparator />

      <ActionsMenuDuplicate
        {...entity}
        disabled={!canUpdate}
        mutationOptions={orpc.posts.duplicate.mutationOptions}
      />

      <DropdownMenuSeparator />

      <ActionsMenuDelete
        {...entity}
        disabled={!canDelete}
        mutationOptions={orpc.posts.remove.mutationOptions}
      />
    </ActionsMenu>
  )
}
