"use client"

import { isValidUrl } from "@dirstack/utils"
import { GlobeIcon } from "lucide-react"
import type { ComponentProps } from "react"
import type { Tool } from "~/.generated/prisma/browser"
import {
  ActionsMenu,
  ActionsMenuDelete,
  ActionsMenuDuplicate,
  ActionsMenuEdit,
  ActionsMenuView,
} from "~/components/app/actions-menu"
import { DropdownMenuItem, DropdownMenuSeparator } from "~/components/common/dropdown-menu"
import { ExternalLink } from "~/components/web/external-link"
import { useCan } from "~/contexts/user-context"
import { orpc } from "~/lib/orpc-query"

interface ToolActionsProps extends ComponentProps<typeof ActionsMenu> {
  tool: Tool
}

export function ToolActions({ tool, ...props }: ToolActionsProps) {
  const canUpdate = useCan("tools.update")
  const canDelete = useCan("tools.delete")
  const entity = { indexPath: "/app/tools", id: tool.id, label: "tool", queryKey: orpc.tools.key() }

  return (
    <ActionsMenu {...props}>
      <ActionsMenuEdit {...entity} />
      <ActionsMenuView href={`/${tool.slug}`} />
      <DropdownMenuSeparator />

      <ActionsMenuDuplicate
        {...entity}
        disabled={!canUpdate}
        mutationOptions={orpc.tools.duplicate.mutationOptions}
      />

      {isValidUrl(tool.websiteUrl) && (
        <DropdownMenuItem render={<ExternalLink href={tool.websiteUrl} doTrack />}>
          <GlobeIcon />
          Visit website
        </DropdownMenuItem>
      )}

      <DropdownMenuSeparator />

      <ActionsMenuDelete
        {...entity}
        disabled={!canDelete}
        mutationOptions={orpc.tools.remove.mutationOptions}
        description={
          <>
            This action cannot be undone. <strong>{tool.name}</strong> will be permanently deleted
            from the database along with its media.
          </>
        }
      />
    </ActionsMenu>
  )
}
