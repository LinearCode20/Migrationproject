import "dotenv/config"
import { Text } from "@react-email/components"
import { EmailFeatureNudge } from "~/emails/components/feature-nudge"
import { EmailGreeting } from "~/emails/components/greeting"
import { EmailWrapper, type EmailWrapperProps } from "~/emails/components/wrapper"
import { isToolPublished, isToolTopTier } from "~/lib/tools"
import type { ToolWithOwner } from "~/server/tools/payloads"

interface EmailProps extends EmailWrapperProps {
  tool: ToolWithOwner
}

export function EmailSubmissionPremium({ tool, ...props }: EmailProps) {
  const isTopTier = isToolTopTier(tool)
  const isLive = !!tool.publishedAt && isToolPublished(tool)

  return (
    <EmailWrapper {...props}>
      <EmailGreeting name={tool.owner?.name} />

      {isTopTier && isLive && (
        <Text>
          Thanks for featuring {tool.name}, it should soon be displayed at a prominent place on our
          listings. If that's not the case, please clear your cache and refresh the page.
        </Text>
      )}

      {isTopTier && !isLive && (
        <Text>
          Thanks for featuring {tool.name}, it will now be reviewed and added to our directory{" "}
          <strong>within 12 hours</strong>. If you want your tool published on a specific date,
          please let us know. We'll do our best to meet your request.
        </Text>
      )}

      {!isTopTier && (
        <>
          <Text>
            Thanks for submitting {tool.name}, it will now be reviewed and added to our directory{" "}
            <strong>within 24 hours</strong>. If you want your tool published on a specific date,
            please let us know. We'll do our best to meet your request.
          </Text>

          <EmailFeatureNudge tool={tool} showButton />
        </>
      )}
    </EmailWrapper>
  )
}

EmailSubmissionPremium.PreviewProps = {
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

export default EmailSubmissionPremium
