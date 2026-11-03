import { Hr, Link, Text } from "@react-email/components"
import { type Tool } from "~/.generated/prisma/client"
import { siteConfig } from "~/config/site"
import { EmailButton } from "~/emails/components/button"
import { isToolTopTier } from "~/lib/tools"

interface EmailFeatureNudgeProps {
  tool: Tool
  showButton?: boolean
}

export function EmailFeatureNudge({ tool, showButton }: EmailFeatureNudgeProps) {
  const link = `${siteConfig.url}/submit/${tool.slug}`

  const benefits = [
    "⏱️ Get published within 12 hours",
    "🔗 Get a dofollow backlink",
    "⭐ Featured on our homepage",
    "📌 Prominent placement in every listing",
    "✏️ Unlimited content updates",
  ]

  if (isToolTopTier(tool)) {
    return null
  }

  return (
    <>
      {showButton && <Hr />}

      <Text>
        Want to get more exposure for {tool.name}? <Link href={link}>Upgrade your listing</Link> to
        unlock extra features:
      </Text>

      <ul>
        {benefits.map(benefit => (
          <li key={benefit}>
            <Text className="m-0">{benefit}</Text>
          </li>
        ))}
      </ul>

      {showButton && <EmailButton href={link}>Upgrade {tool.name}'s listing</EmailButton>}
    </>
  )
}
