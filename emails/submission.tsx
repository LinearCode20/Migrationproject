import "dotenv/config"
import { Text } from "@react-email/components"
import { EmailExpediteNudge } from "~/emails/components/expedite-nudge"
import { EmailGreeting } from "~/emails/components/greeting"
import { EmailWrapper, type EmailWrapperProps } from "~/emails/components/wrapper"
import { calculateQueueDuration, isQueueLong } from "~/lib/products"
import type { ToolWithOwner } from "~/server/tools/payloads"

interface EmailProps extends EmailWrapperProps {
  tool: ToolWithOwner
  queue?: number
}

export function EmailSubmission({ tool, queue = 100, ...props }: EmailProps) {
  return (
    <EmailWrapper {...props}>
      <EmailGreeting name={tool.owner?.name} />

      <Text>
        Thanks for submitting {tool.name}! Our team reviews every submission by hand, and it'll only
        be published once it's approved.
      </Text>

      {isQueueLong(queue) && (
        <EmailExpediteNudge tool={tool}>
          <strong>{calculateQueueDuration(queue)}</strong> from now
        </EmailExpediteNudge>
      )}
    </EmailWrapper>
  )
}

EmailSubmission.PreviewProps = {
  to: "alex@example.com",
  tool: {
    name: "Example Tool",
    slug: "example-tool",
    websiteUrl: "https://example.com",
    owner: { id: "example-owner", name: "John Doe", email: "alex@example.com" },
    publishedAt: null,
    status: "Draft",
  } as ToolWithOwner,
} satisfies EmailProps

export default EmailSubmission
