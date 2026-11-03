import "dotenv/config"
import { Text } from "@react-email/components"
import { siteConfig } from "~/config/site"
import { EmailActionNudge } from "~/emails/components/action-nudge"
import { EmailButton } from "~/emails/components/button"
import { EmailFeatureNudge } from "~/emails/components/feature-nudge"
import { EmailGreeting } from "~/emails/components/greeting"
import { EmailWrapper, type EmailWrapperProps } from "~/emails/components/wrapper"
import type { ToolWithOwner } from "~/server/tools/payloads"

interface EmailProps extends EmailWrapperProps {
  tool: ToolWithOwner
}

export function EmailSubmissionPublished({ tool, ...props }: EmailProps) {
  const toolUrl = `${siteConfig.url}/${tool.slug}`

  return (
    <EmailWrapper {...props}>
      <EmailGreeting name={tool.owner?.name} />

      <Text>
        Great news! Your submitted tool, <strong>{tool.name}</strong>, is now{" "}
        <strong>live on {siteConfig.name}</strong>. Thank you for sharing this awesome resource with
        our community!
      </Text>

      <Text>
        We'd love it if you could spread the word. A quick post on your favorite social platform or
        community about {tool.name} would mean a lot to us. It helps other people discover cool
        tools like yours!
      </Text>

      <EmailButton href={toolUrl}>
        Check out {tool.name} on {siteConfig.name}
      </EmailButton>

      <EmailActionNudge tool={tool} />
      <EmailFeatureNudge tool={tool} />
    </EmailWrapper>
  )
}

EmailSubmissionPublished.PreviewProps = {
  to: "alex@example.com",
  tool: {
    name: "Example Tool",
    slug: "example-tool",
    websiteUrl: "https://example.com",
    owner: { id: "example-owner", name: "John Doe", email: "alex@example.com" },
    publishedAt: new Date(),
    status: "Published",
  } as ToolWithOwner,
} satisfies EmailProps

export default EmailSubmissionPublished
