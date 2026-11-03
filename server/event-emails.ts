import {
  notifyAdminOfDowngradedTool,
  notifyAdminOfPaidTool,
  notifyAdminOfReport,
  notifyOwnerOfDowngradedTool,
  notifyOwnerOfPaidTool,
  notifyOwnerOfStatusChange,
  notifyOwnerOfToolSubmitted,
} from "~/lib/notifications"
import type { Event } from "~/server/events"
import { findReportById } from "~/server/reports/queries"
import { findToolById } from "~/server/tools/queries"

/**
 * Run the email side effects a domain event triggers, if any. The email outlet
 * of `sendEvent`. Each row is fetched fresh by id here, inside `after()` and off
 * the request path, so a row deleted between emit and delivery simply skips. An
 * event with no case (e.g. one that only feeds the webhook) sends nothing.
 */
export async function sendEventEmails(event: Event) {
  switch (event.event) {
    case "tool.submitted": {
      const tool = await findToolById(event.data.toolId)
      if (tool) {
        await notifyOwnerOfToolSubmitted(tool)
      }
      break
    }

    case "tool.status_changed": {
      // The admin's per-action "notify owner" choice gates the email; the
      // webhook already fired regardless.
      if (!event.data.notifyOwner) {
        break
      }
      const tool = await findToolById(event.data.toolId)
      if (tool) {
        await notifyOwnerOfStatusChange(tool)
      }
      break
    }

    case "tool.tier_upgraded": {
      const tool = await findToolById(event.data.toolId)
      if (tool) {
        // Two independent sends: a failing owner email must not skip the
        // admin's paid-tool notification.
        await Promise.allSettled([notifyOwnerOfPaidTool(tool), notifyAdminOfPaidTool(tool)])
      }
      break
    }

    case "tool.tier_downgraded": {
      const tool = await findToolById(event.data.toolId)
      if (tool) {
        const { previousTier } = event.data
        await Promise.allSettled([
          notifyOwnerOfDowngradedTool(tool, previousTier),
          notifyAdminOfDowngradedTool(tool, previousTier),
        ])
      }
      break
    }

    case "report.created": {
      const report = await findReportById(event.data.reportId)
      if (report) {
        const tool = report.toolId ? await findToolById(report.toolId) : null
        await notifyAdminOfReport({ ...report, tool })
      }
      break
    }
  }
}
