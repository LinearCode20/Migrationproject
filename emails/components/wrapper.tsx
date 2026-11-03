import {
  Body,
  Container,
  type ContainerProps,
  Head,
  Hr,
  Html,
  Img,
  Link,
  pixelBasedPreset,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components"
import { siteConfig } from "~/config/site"

export interface EmailWrapperProps extends ContainerProps {
  to: string
  preview?: string
}

export function EmailWrapper({ to, preview, children, ...props }: EmailWrapperProps) {
  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}

      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Body className="mx-auto my-auto bg-background font-sans">
          <Container className="w-full max-w-140 mx-auto py-4 px-8" {...props}>
            <Link href={siteConfig.url} className="inline-block mt-6 mb-2">
              <Img
                src={`${siteConfig.url}/logo.png`}
                alt={`${siteConfig.name} Logo`}
                width="572"
                height="91"
                className="h-6 w-auto"
              />
            </Link>

            {children}

            <Hr className="my-4" />

            <Text className="text-xs/normal text-gray-500">
              This email was intended for <span className="text-black">{to}</span>. If you were not
              expecting this email, you can ignore it. If you are concerned about your accounts
              safety, please reply to this email to get in touch with us.
            </Text>

            <Text className="text-xs/normal text-gray-500">
              Any questions? Please feel free to reach us at {siteConfig.email}.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
