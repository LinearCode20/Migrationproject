"use client"

import type { ComponentProps } from "react"
import type { Category } from "~/.generated/prisma/browser"
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

interface CategoryActionsProps extends ComponentProps<typeof ActionsMenu> {
  category: Category
}

export function CategoryActions({ category, ...props }: CategoryActionsProps) {
  const canUpdate = useCan("categories.update")
  const canDelete = useCan("categories.delete")
  const entity = {
    indexPath: "/app/categories",
    id: category.id,
    label: "category",
    queryKey: orpc.categories.key(),
  }

  return (
    <ActionsMenu {...props}>
      <ActionsMenuEdit {...entity} />
      <ActionsMenuView href={`/categories/${category.slug}`} />
      <DropdownMenuSeparator />

      <ActionsMenuDuplicate
        {...entity}
        disabled={!canUpdate}
        mutationOptions={orpc.categories.duplicate.mutationOptions}
      />

      <DropdownMenuSeparator />

      <ActionsMenuDelete
        {...entity}
        disabled={!canDelete}
        mutationOptions={orpc.categories.remove.mutationOptions}
      />
    </ActionsMenu>
  )
}
