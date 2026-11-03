import "dotenv/config"
import { Text } from "@react-email/components"
import { type Report, type Tool } from "~/.generated/prisma/client"
import { siteConfig } from "~/config/site"
import { EmailButton } from "~/emails/components/button"
import { EmailWrapper, type EmailWrapperProps } from "~/emails/components/wrapper"

interface EmailProps extends EmailWrapperProps {
  report: Report & { tool: Tool | null }
}

export function EmailAdminReport({ report, ...props }: EmailProps) {
  return (
    <EmailWrapper {...props}>
      <Text>Hi!</Text>

      <Text>
        A new report was submitted{report.tool ? ` for ${report.tool.name}` : ""}. Reason:{" "}
        <strong>{report.type}</strong>.{report.email ? ` Reported by ${report.email}.` : ""}
      </Text>

      {report.message && <Text>“{report.message}”</Text>}

      <EmailButton href={`${siteConfig.url}/app/reports/${report.id}`}>Review report</EmailButton>
    </EmailWrapper>
  )
}

EmailAdminReport.PreviewProps = {
  to: "alex@example.com",
  report: {
    id: "example-id",
    type: "BrokenLink",
    message: "The website link returns a 404.",
    email: "reporter@example.com",
    tool: { name: "Example Tool" } as Tool,
  } as Report & { tool: Tool | null },
} satisfies EmailProps

export default EmailAdminReport
