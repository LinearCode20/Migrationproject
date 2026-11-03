"use client"

import type { ComponentProps } from "react"
import type { Report } from "~/.generated/prisma/browser"
import {
  ActionsMenu,
  ActionsMenuDelete,
  ActionsMenuEdit,
  useIsSinglePage,
} from "~/components/app/actions-menu"
import { DropdownMenuSeparator } from "~/components/common/dropdown-menu"
import { useCan } from "~/contexts/user-context"
import { orpc } from "~/lib/orpc-query"

interface ReportActionsProps extends ComponentProps<typeof ActionsMenu> {
  report: Report
}

export function ReportActions({ report, ...props }: ReportActionsProps) {
  const canDelete = useCan("reports.delete")
  const entity = { indexPath: "/app/reports", id: report.id }
  const isSinglePage = useIsSinglePage(entity.indexPath, entity.id)

  return (
    <ActionsMenu {...props}>
      {!isSinglePage && (
        <>
          <ActionsMenuEdit {...entity} />
          <DropdownMenuSeparator />
        </>
      )}

      <ActionsMenuDelete
        {...entity}
        label="report"
        disabled={!canDelete}
        mutationOptions={orpc.reports.remove.mutationOptions}
        queryKey={orpc.reports.key()}
      />
    </ActionsMenu>
  )
}
