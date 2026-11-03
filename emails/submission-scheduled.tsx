import "dotenv/config"
import { Text } from "@react-email/components"
import { addHours, differenceInDays, format, formatDistanceToNowStrict } from "date-fns"
import { siteConfig } from "~/config/site"
import { EmailActionNudge } from "~/emails/components/action-nudge"
import { EmailExpediteNudge } from "~/emails/components/expedite-nudge"
import { EmailGreeting } from "~/emails/components/greeting"
import { EmailWrapper, type EmailWrapperProps } from "~/emails/components/wrapper"
import type { ToolWithOwner } from "~/server/tools/payloads"

interface EmailProps extends EmailWrapperProps {
  tool: ToolWithOwner
}

export function EmailSubmissionScheduled({ tool, ...props }: EmailProps) {
  // Unscheduled tools fall back to the current time.
  const publishedAt = addHours(tool.publishedAt ?? new Date(), 2)
  const isLongQueue = differenceInDays(publishedAt, Date.now()) > 7
  const dateRelative = formatDistanceToNowStrict(publishedAt, { addSuffix: true })
  const dateFormatted = format(publishedAt, "MMMM do, yyyy")

  return (
    <EmailWrapper {...props}>
      <EmailGreeting name={tool.owner?.name} />

      <Text>
        Great news! Your submitted tool, <strong>{tool.name}</strong>, was{" "}
        <strong>accepted and scheduled</strong> for publication on {siteConfig.name}.
      </Text>

      {isLongQueue ? (
        <EmailExpediteNudge tool={tool}>
          on <strong>{dateFormatted}</strong>
        </EmailExpediteNudge>
      ) : (
        <Text>
          {tool.name} is scheduled to be added <strong>{dateRelative}</strong>.
        </Text>
      )}

      <EmailActionNudge tool={tool} />
    </EmailWrapper>
  )
}

EmailSubmissionScheduled.PreviewProps = {
  to: "alex@example.com",
  tool: {
    name: "Example Tool",
    slug: "example-tool",
    websiteUrl: "https://example.com",
    owner: { id: "example-owner", name: "John Doe", email: "alex@example.com" },
    publishedAt: addHours(new Date(), 2),
    status: "Scheduled",
  } as ToolWithOwner,
} satisfies EmailProps

export default EmailSubmissionScheduled
