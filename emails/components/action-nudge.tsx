import { Link, Text } from "@react-email/components"
import type { Tool } from "~/.generated/prisma/client"
import { siteConfig } from "~/config/site"
import { isToolPublished } from "~/lib/tools"

interface EmailActionNudgeProps {
  tool: Tool
}

export function EmailActionNudge({ tool }: EmailActionNudgeProps) {
  const link = `${siteConfig.url}/${tool.slug}`
  const badgeLabel = isToolPublished(tool) ? "Featured on" : "Coming soon on"

  return (
    <Text>
      Want to build credibility with your users? You can now{" "}
      <Link href={`${link}?dialog=embed`}>
        add a "{badgeLabel} {siteConfig.name}" badge
      </Link>{" "}
      to your website, showing visitors that {tool.name} is recognized by our community.
      {!tool.verifiedAt && (
        <>
          {" "}
          Also, don't forget to <Link href={`${link}?dialog=verify`}>verify your tool</Link> to get
          a <strong>verified badge</strong> that helps establish trust with potential users.
        </>
      )}
    </Text>
  )
}
