import { Text } from "@react-email/components"
import type { PropsWithChildren } from "react"
import type { Tool } from "~/.generated/prisma/client"
import { siteConfig } from "~/config/site"
import { EmailButton } from "~/emails/components/button"
import { isToolWithinExpediteThreshold } from "~/lib/tools"

type EmailExpediteNudgeProps = PropsWithChildren<{
  tool: Tool
}>

export function EmailExpediteNudge({ children, tool }: EmailExpediteNudgeProps) {
  const link = `${siteConfig.url}/submit/${tool.slug}`

  if (isToolWithinExpediteThreshold(tool)) {
    return null
  }

  return (
    <>
      <Text>
        Due to the high volume of submissions, there's a long queue for publication, so {tool.name}{" "}
        is expected to go live {children}. However, you can upgrade your listing to skip the queue
        and get published within 24 hours.
      </Text>

      <EmailButton href={link}>Upgrade {tool.name}'s listing</EmailButton>
    </>
  )
}
