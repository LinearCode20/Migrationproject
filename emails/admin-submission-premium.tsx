import "dotenv/config"
import { Text } from "@react-email/components"
import { siteConfig } from "~/config/site"
import { EmailButton } from "~/emails/components/button"
import { EmailWrapper, type EmailWrapperProps } from "~/emails/components/wrapper"
import type { ToolWithOwner } from "~/server/tools/payloads"

interface EmailProps extends EmailWrapperProps {
  tool: ToolWithOwner
}

export function EmailAdminSubmissionPremium({ tool, ...props }: EmailProps) {
  return (
    <EmailWrapper {...props}>
      <Text>Hi!</Text>

      <Text>
        {tool.owner?.name || tool.owner?.email || "Someone"} has opted to upgrade the submission of{" "}
        {tool.name} to the {tool.tier} tier. You should review and approve it as soon as possible.
      </Text>

      <EmailButton href={`${siteConfig.url}/app/tools/${tool.id}`}>Review {tool.name}</EmailButton>
    </EmailWrapper>
  )
}

EmailAdminSubmissionPremium.PreviewProps = {
  to: "alex@example.com",
  tool: {
    id: "example-id",
    name: "Example Tool",
    slug: "example-tool",
    websiteUrl: "https://example.com",
    owner: { id: "example-owner", name: "John Doe", email: "alex@example.com" },
    publishedAt: null,
    status: "Draft",
  } as ToolWithOwner,
} satisfies EmailProps

export default EmailAdminSubmissionPremium
