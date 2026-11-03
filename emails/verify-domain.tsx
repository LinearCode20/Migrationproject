import "dotenv/config"
import { Preview, Section, Text } from "@react-email/components"
import { siteConfig } from "~/config/site"
import { verificationsConfig } from "~/config/verifications"
import { EmailWrapper, type EmailWrapperProps } from "~/emails/components/wrapper"

interface EmailProps extends EmailWrapperProps {
  otp: string
}

export function EmailVerifyDomain({ otp, ...props }: EmailProps) {
  const previewText = `Your code to verify domain ownership on ${siteConfig.name}`

  return (
    <EmailWrapper {...props}>
      <Preview>{previewText}</Preview>

      <Text>Hello,</Text>

      <Text>
        You're receiving this email to verify ownership of the domain of a tool on{" "}
        <strong>{siteConfig.name}</strong>. Please use the following one-time password (OTP) to
        complete the verification process:
      </Text>

      <Section className="my-4">
        <Text className="inline-block px-4 py-3 bg-gray-100 text-4xl font-semibold leading-none tracking-widest tabular-nums rounded-md">
          {otp}
        </Text>
      </Section>

      <Text>
        This code will expire in {verificationsConfig.otpExpiration} minutes. Do not share this code
        with anyone.
      </Text>

      <Text>
        If you did not request this verification, you can ignore this email. If you are concerned
        about your account's safety, please reply to this email to get in touch with us.
      </Text>
    </EmailWrapper>
  )
}

EmailVerifyDomain.PreviewProps = {
  to: "alex@example.com",
  otp: "123456",
} satisfies EmailProps

export default EmailVerifyDomain
