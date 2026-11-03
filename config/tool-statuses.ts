import { BadgeCheckIcon, CalendarIcon } from "lucide-react"
import { type ComponentProps, createElement } from "react"
import { type Prisma, ToolStatus } from "~/.generated/prisma/browser"
import type { PublishActionConfig } from "~/components/app/publish-actions"
import type { Badge } from "~/components/common/badge"

export type StatusAlertVariant = "info" | "success" | "warning"

/**
 * Email handler keys for status transitions performed by admins. Values map to
 * concrete handlers in `lib/notifications.ts` via `notifyOwnerOfStatusChange`.
 * The submission email (`Pending` on user submit) goes out through the
 * `tool.submitted` event (`sendEvent` in `server/events.ts`) and is not part
 * of this transition lifecycle.
 */
type ToolStatusEmailKind = "scheduled" | "published"

interface ToolStatusConfig {
  /** Badge props (variant) used in admin table cells and filter labels. */
  badge: ComponentProps<typeof Badge>

  /** Tool appears in public listings, search, RSS, sitemap, and home count. */
  publiclyListed: boolean

  /** `/[slug]/badge.svg` resolves; otherwise the badge endpoint 404s. */
  badgeSvgVisible: boolean

  /** Tool shows up in the admin schedule calendar view. */
  adminCalendarVisible: boolean

  /** Counted by `countSubmittedTools` (the submission-queue length). */
  countsAsQueued: boolean

  /** Owner sees the embed dialog / "get the badge" action. */
  ownerCanEmbed: boolean

  /** Public page renders `<ToolStatusAlert>` with this variant; `null` hides it. */
  showsPreviewAlert: StatusAlertVariant | null

  /** Email dispatched when a tool transitions INTO this status; `null` = no email. */
  emailOnEnter: ToolStatusEmailKind | null

  /** Admin publish-actions state machine: buttons and popover options for this status. */
  adminActions: PublishActionConfig<ToolStatus>[]
}

export const toolStatusConfig: Record<ToolStatus, ToolStatusConfig> = {
  [ToolStatus.Draft]: {
    badge: { variant: "soft" },
    publiclyListed: false,
    badgeSvgVisible: false,
    adminCalendarVisible: false,
    countsAsQueued: false,
    ownerCanEmbed: false,
    showsPreviewAlert: "warning",
    emailOnEnter: null,
    adminActions: [
      {
        type: "button",
        children: "Publish",
        variant: "fancy",
        popover: {
          title: "Ready to publish this tool?",
          options: [
            {
              status: ToolStatus.Published,
              title: "Publish now",
              description: "Set this tool live immediately",
              submit: { date: "now", label: "Publish" },
            },
            {
              status: ToolStatus.Scheduled,
              title: "Schedule for later",
              description: "Set automatic future publish date",
              submit: { date: "scheduled", label: "Schedule" },
            },
          ],
        },
      },
      {
        type: "submit",
        children: "Save Draft",
        variant: "primary",
      },
    ],
  },

  [ToolStatus.Pending]: {
    badge: { variant: "warning" },
    publiclyListed: false,
    badgeSvgVisible: false,
    adminCalendarVisible: false,
    countsAsQueued: true,
    ownerCanEmbed: false,
    showsPreviewAlert: "warning",
    emailOnEnter: null,
    adminActions: [
      {
        type: "button",
        children: "Review",
        variant: "fancy",
        popover: {
          title: "Review the pending submission",
          options: [
            {
              status: ToolStatus.Published,
              title: "Publish now",
              description: "Approve and publish this tool immediately",
              submit: { date: "now", label: "Publish" },
            },
            {
              status: ToolStatus.Scheduled,
              title: "Schedule for later",
              description: "Set automatic future publish date",
              submit: { date: "scheduled", label: "Schedule" },
            },
          ],
        },
      },
      {
        type: "submit",
        children: "Update",
        variant: "primary",
      },
    ],
  },

  [ToolStatus.Scheduled]: {
    badge: { variant: "info" },
    publiclyListed: false,
    badgeSvgVisible: true,
    adminCalendarVisible: true,
    countsAsQueued: true,
    ownerCanEmbed: true,
    showsPreviewAlert: "warning",
    emailOnEnter: "scheduled",
    adminActions: [
      {
        type: "button",
        children: "Scheduled",
        variant: "secondary",
        prefix: createElement(CalendarIcon),
        popover: {
          title: "Update tool status",
          options: [
            {
              status: ToolStatus.Draft,
              title: "Revert to draft",
              description: "Do not publish",
              submit: { date: null, label: "Unschedule" },
            },
            {
              status: ToolStatus.Scheduled,
              title: "Schedule for later",
              description: "Set automatic future publish date",
              submit: { date: "scheduled", label: "Reschedule" },
            },
            {
              status: ToolStatus.Published,
              title: "Publish now",
              description: "Set this tool live immediately",
              submit: { date: "now", label: "Publish" },
            },
          ],
        },
      },
      {
        type: "submit",
        children: "Update",
        variant: "primary",
      },
    ],
  },

  [ToolStatus.Published]: {
    badge: { variant: "success" },
    publiclyListed: true,
    badgeSvgVisible: true,
    adminCalendarVisible: true,
    countsAsQueued: false,
    ownerCanEmbed: true,
    showsPreviewAlert: null,
    emailOnEnter: "published",
    adminActions: [
      {
        type: "button",
        children: "Published",
        variant: "secondary",
        prefix: createElement(BadgeCheckIcon),
        popover: {
          title: "Update tool status",
          options: [
            {
              status: ToolStatus.Draft,
              title: "Unpublish",
              description: "Revert this tool to a draft",
              submit: { date: null, label: "Unpublish" },
            },
            {
              status: ToolStatus.Published,
              title: "Published",
              description: "Keep this tool publicly available",
            },
          ],
        },
      },
      {
        type: "submit",
        children: "Update",
        variant: "primary",
      },
    ],
  },
}

const statusEntries = Object.entries(toolStatusConfig) as [ToolStatus, ToolStatusConfig][]

/** Keys of {@link ToolStatusConfig} whose value is a boolean, the only ones `statusesWhere` can filter on. */
type BooleanStatusFlag = {
  [K in keyof ToolStatusConfig]: ToolStatusConfig[K] extends boolean ? K : never
}[keyof ToolStatusConfig]

function statusesWhere(key: BooleanStatusFlag): ToolStatus[] {
  return statusEntries.filter(([, config]) => config[key]).map(([status]) => status)
}

/**
 * Statuses that appear on the public site. Raw SQL and search-engine filter strings use this
 * plain list, since they cannot take the Prisma `publiclyListedToolFilter` object.
 */
export const publiclyListedStatuses = statusesWhere("publiclyListed")
export const badgeSvgStatuses = statusesWhere("badgeSvgVisible")
export const adminCalendarStatuses = statusesWhere("adminCalendarVisible")
export const queuedStatuses = statusesWhere("countsAsQueued")

/** Relation-read filter (`_count`, `some`) for publicly-listed tools. */
export const publiclyListedToolFilter = {
  status: { in: publiclyListedStatuses },
} satisfies Prisma.ToolWhereInput

/** Statuses an admin can transition INTO that fire an owner email. */
export const notifyableStatuses = statusEntries
  .filter(([, config]) => config.emailOnEnter !== null)
  .map(([status]) => status)

/** Per-status admin action config consumed by `PublishActions`. */
export const toolAdminActions = Object.fromEntries(
  statusEntries.map(([status, config]) => [status, config.adminActions]),
) as Record<ToolStatus, ToolStatusConfig["adminActions"]>
