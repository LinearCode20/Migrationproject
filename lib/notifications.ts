import type { Report, ToolTier } from "~/.generated/prisma/client"
import { siteConfig } from "~/config/site"
import { tiersConfig } from "~/config/tiers"
import { toolStatusConfig } from "~/config/tool-statuses"
import { EmailAdminReport } from "~/emails/admin-report"
import { EmailAdminSubmissionDowngraded } from "~/emails/admin-submission-downgraded"
import { EmailAdminSubmissionPremium } from "~/emails/admin-submission-premium"
import { EmailSubmission } from "~/emails/submission"
import { EmailSubmissionDowngraded } from "~/emails/submission-downgraded"
import { EmailSubmissionPremium } from "~/emails/submission-premium"
import { EmailSubmissionPublished } from "~/emails/submission-published"
import { EmailSubmissionScheduled } from "~/emails/submission-scheduled"
import { sendEmail } from "~/lib/email"
import type { ToolWithOwner } from "~/server/tools/payloads"
import { countSubmittedTools } from "~/server/tools/queries"

/**
 * Notify the owner of a tool submission
 *
 * @param tool - The tool to notify the owner of
 * @returns The email that was sent
 */
export async function notifyOwnerOfToolSubmitted(tool: ToolWithOwner) {
  if (!tool.owner) {
    return
  }

  const to = tool.owner.email
  const subject = `🙌 Thanks for submitting ${tool.name}!`
  const queue = await countSubmittedTools()

  return await sendEmail({
    to,
    subject,
    react: EmailSubmission({ to, tool, queue }),
  })
}

async function notifyOwnerOfToolScheduled(tool: ToolWithOwner) {
  if (!tool.owner || !tool.publishedAt) {
    return
  }

  const to = tool.owner.email
  const subject = `Great news! ${tool.name} is scheduled for publication on ${siteConfig.name} 🎉`

  return await sendEmail({
    to,
    subject,
    react: EmailSubmissionScheduled({ to, tool }),
  })
}

async function notifyOwnerOfToolPublished(tool: ToolWithOwner) {
  if (!tool.owner || !tool.publishedAt) {
    return
  }

  const to = tool.owner.email
  const subject = `${tool.name} has been published on ${siteConfig.name} 🎉`

  return await sendEmail({
    to,
    subject,
    react: EmailSubmissionPublished({ to, tool }),
  })
}

/**
 * Dispatch the owner email tied to a tool's current status, if any.
 * The mapping lives in `config/tool-statuses.ts` (`emailOnEnter`).
 */
export async function notifyOwnerOfStatusChange(tool: ToolWithOwner) {
  const kind = toolStatusConfig[tool.status].emailOnEnter

  if (!kind) {
    return
  }

  switch (kind) {
    case "scheduled":
      return notifyOwnerOfToolScheduled(tool)
    case "published":
      return notifyOwnerOfToolPublished(tool)
  }
}

/**
 * Notify the owner of a premium tool
 *
 * @param tool - The tool to notify the owner of
 * @returns The email that was sent
 */
export async function notifyOwnerOfPaidTool(tool: ToolWithOwner) {
  if (!tool.owner) {
    return
  }

  const to = tool.owner.email
  const subject = `🙌 Thank you for upgrading ${tool.name}!`

  return await sendEmail({
    to,
    subject,
    react: EmailSubmissionPremium({ to, tool }),
  })
}

/**
 * Notify the admin of a premium tool
 *
 * @param tool - The tool to notify the admin of
 * @returns The email that was sent
 */
export async function notifyAdminOfPaidTool(tool: ToolWithOwner) {
  const to = siteConfig.email
  const subject = `New ${tool.tier.toLowerCase()} tool: ${tool.name}`

  return await sendEmail({
    to,
    subject,
    replyTo: tool.owner?.email,
    react: EmailAdminSubmissionPremium({ to, tool }),
  })
}

/**
 * Notify the owner that a paid listing ended, with a link to renew it
 *
 * @param tool - The tool to notify the owner of
 * @param previousTier - The tier the tool had before the subscription ended
 * @returns The email that was sent
 */
export async function notifyOwnerOfDowngradedTool(tool: ToolWithOwner, previousTier: ToolTier) {
  if (!tool.owner) {
    return
  }

  const to = tool.owner.email
  const subject = `The ${tiersConfig[previousTier].label} for ${tool.name} has ended`

  return await sendEmail({
    to,
    subject,
    react: EmailSubmissionDowngraded({ to, tool, previousTier }),
  })
}

/**
 * Notify the admin that a paid listing ended
 *
 * @param tool - The tool to notify the admin of
 * @param previousTier - The tier the tool had before the subscription ended
 * @returns The email that was sent
 */
export async function notifyAdminOfDowngradedTool(tool: ToolWithOwner, previousTier: ToolTier) {
  const to = siteConfig.email
  const subject = `Ended ${previousTier.toLowerCase()} tool: ${tool.name}`

  return await sendEmail({
    to,
    subject,
    replyTo: tool.owner?.email,
    react: EmailAdminSubmissionDowngraded({ to, tool, previousTier }),
  })
}

interface ReportWithTool extends Report {
  tool: ToolWithOwner | null
}

/**
 * Notify the admin of a new report
 *
 * @param report - The report (with its tool) to notify the admin of
 * @returns The email that was sent
 */
export async function notifyAdminOfReport(report: ReportWithTool) {
  const to = siteConfig.email
  const subject = `New report${report.tool ? `: ${report.tool.name}` : ""} (${report.type})`

  return await sendEmail({
    to,
    subject,
    replyTo: report.email || undefined,
    react: EmailAdminReport({ to, report }),
  })
}
