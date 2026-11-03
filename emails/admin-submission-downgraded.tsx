import "dotenv/config"
import { Text } from "@react-email/components"
import type { Tool, ToolTier } from "~/.generated/prisma/client"
import { siteConfig } from "~/config/site"
import { tiersConfig } from "~/config/tiers"
import { EmailButton } from "~/emails/components/button"
import { EmailWrapper, type EmailWrapperProps } from "~/emails/components/wrapper"

interface EmailProps extends EmailWrapperProps {
  tool: Tool
  previousTier: ToolTier
}

export function EmailAdminSubmissionDowngraded({ tool, previousTier, ...props }: EmailProps) {
  return (
    <EmailWrapper {...props}>
      <Text>Hi!</Text>

      <Text>
        The {tiersConfig[previousTier].label} subscription for {tool.name} has ended, and the tool
        is back on the {tiersConfig[tool.tier].label}.
      </Text>

      <EmailButton href={`${siteConfig.url}/app/tools/${tool.id}`}>View {tool.name}</EmailButton>
    </EmailWrapper>
  )
}

EmailAdminSubmissionDowngraded.PreviewProps = {
  to: "alex@example.com",
  previousTier: "Premium",
  tool: {
    id: "example-id",
    name: "Example Tool",
    slug: "example-tool",
    websiteUrl: "https://example.com",
    tier: "Free",
    publishedAt: null,
    status: "Published",
  } as Tool,
} satisfies EmailProps

export default EmailAdminSubmissionDowngraded
