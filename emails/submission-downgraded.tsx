import "dotenv/config"
import { Text } from "@react-email/components"
import type { ToolTier } from "~/.generated/prisma/client"
import { siteConfig } from "~/config/site"
import { tiersConfig } from "~/config/tiers"
import { EmailButton } from "~/emails/components/button"
import { EmailGreeting } from "~/emails/components/greeting"
import { EmailWrapper, type EmailWrapperProps } from "~/emails/components/wrapper"
import type { ToolWithOwner } from "~/server/tools/payloads"

interface EmailProps extends EmailWrapperProps {
  tool: ToolWithOwner
  previousTier: ToolTier
}

export function EmailSubmissionDowngraded({ tool, previousTier, ...props }: EmailProps) {
  const link = `${siteConfig.url}/submit/${tool.slug}`
  const previousLabel = tiersConfig[previousTier].label
  const currentLabel = tiersConfig[tool.tier].label

  return (
    <EmailWrapper {...props}>
      <EmailGreeting name={tool.owner?.name} />

      <Text>
        The {previousLabel} for {tool.name} on {siteConfig.name} has ended, so it's back on the{" "}
        {currentLabel}. You can renew it any time to get the {previousLabel} features back.
      </Text>

      <EmailButton href={link}>Renew {tool.name}'s listing</EmailButton>
    </EmailWrapper>
  )
}

EmailSubmissionDowngraded.PreviewProps = {
  to: "alex@example.com",
  previousTier: "Premium",
  tool: {
    name: "Example Tool",
    slug: "example-tool",
    websiteUrl: "https://example.com",
    owner: { id: "example-owner", name: "John Doe", email: "alex@example.com" },
    tier: "Free",
    publishedAt: null,
    status: "Published",
  } as ToolWithOwner,
} satisfies EmailProps

export default EmailSubmissionDowngraded
