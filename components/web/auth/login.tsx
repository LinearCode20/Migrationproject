"use client"

import { useTranslations } from "next-intl"
import Image, { type StaticImageData } from "next/image"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"
import { LoginButton } from "~/components/web/auth/login-button"
import { LoginForm } from "~/components/web/auth/login-form"
import { useLoginMethods } from "~/contexts/login-methods-context"
import type { SocialProvider } from "~/lib/auth-client"
import googleIcon from "~/public/google.svg"

/**
 * The icon on each social provider's button. A provider added in `lib/auth.ts` adds its
 * icon here.
 */
const socialProviderIcons: Partial<Record<SocialProvider, StaticImageData>> = {
  google: googleIcon,
}

interface LoginProps {
  callbackURL?: string
}

export function Login({ callbackURL }: LoginProps) {
  const t = useTranslations()
  const { socialProviders } = useLoginMethods()

  return (
    <Stack direction="column" className="items-stretch w-full">
      <LoginForm callbackURL={callbackURL} />

      {socialProviders.length > 0 && (
        <Note className="flex items-center justify-center gap-3 my-2 before:flex-1 before:border-t after:flex-1 after:border-t">
          {t("common.or")}
        </Note>
      )}

      {socialProviders.map(provider => {
        const icon = socialProviderIcons[provider]

        return (
          <LoginButton
            key={provider}
            provider={provider}
            callbackURL={callbackURL}
            suffix={icon && <Image src={icon} alt="" unoptimized className="size-4" />}
          />
        )
      })}
    </Stack>
  )
}
