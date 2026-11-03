import { BadgeCheckIcon, CalendarIcon } from "lucide-react"
import { type ComponentProps, createElement } from "react"
import { PostStatus } from "~/.generated/prisma/browser"
import type { PublishActionConfig } from "~/components/app/publish-actions"
import type { Badge } from "~/components/common/badge"

interface PostStatusConfig {
  /** Badge props (variant) used in admin table cells. */
  badge: ComponentProps<typeof Badge>

  /** Admin publish-actions state machine: buttons and popover options for this status. */
  adminActions: PublishActionConfig<PostStatus>[]
}

export const postStatusConfig: Record<PostStatus, PostStatusConfig> = {
  [PostStatus.Draft]: {
    badge: { variant: "soft" },
    adminActions: [
      {
        type: "button",
        children: "Publish",
        variant: "fancy",
        popover: {
          title: "Ready to publish this post?",
          options: [
            {
              status: PostStatus.Published,
              title: "Publish now",
              description: "Make this post live immediately",
              submit: { date: "now", label: "Publish" },
            },
            {
              status: PostStatus.Scheduled,
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

  [PostStatus.Scheduled]: {
    badge: { variant: "info" },
    adminActions: [
      {
        type: "button",
        children: "Scheduled",
        variant: "secondary",
        prefix: createElement(CalendarIcon),
        popover: {
          title: "Update post status",
          options: [
            {
              status: PostStatus.Draft,
              title: "Revert to draft",
              description: "Do not publish",
              submit: { date: null, label: "Unschedule" },
            },
            {
              status: PostStatus.Scheduled,
              title: "Schedule for later",
              description: "Set automatic future publish date",
              submit: { date: "scheduled", label: "Reschedule" },
            },
            {
              status: PostStatus.Published,
              title: "Publish now",
              description: "Make this post live immediately",
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

  [PostStatus.Published]: {
    badge: { variant: "success" },
    adminActions: [
      {
        type: "button",
        children: "Published",
        variant: "secondary",
        prefix: createElement(BadgeCheckIcon),
        popover: {
          title: "Update post status",
          options: [
            {
              status: PostStatus.Draft,
              title: "Unpublish",
              description: "Revert this post to a draft",
              submit: { date: null, label: "Unpublish" },
            },
            {
              status: PostStatus.Published,
              title: "Published",
              description: "Keep this post publicly available",
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

/** Per-status admin action config consumed by `PublishActions`. */
export const postAdminActions = Object.fromEntries(
  Object.entries(postStatusConfig).map(([status, config]) => [status, config.adminActions]),
) as Record<PostStatus, PostStatusConfig["adminActions"]>
