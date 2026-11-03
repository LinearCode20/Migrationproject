"use client"

import { tryCatch } from "@dirstack/utils"
import { capitalCase } from "change-case"
import { useTranslations } from "next-intl"
import { type ComponentProps, useState } from "react"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import { useAuthCallbackUrl } from "~/hooks/use-auth-callback-url"
import { type SocialProvider, signIn } from "~/lib/auth-client"

interface LoginButtonProps extends ComponentProps<typeof Button> {
  provider: SocialProvider
  callbackURL?: string
}

export function LoginButton({ provider, callbackURL, ...props }: LoginButtonProps) {
  const t = useTranslations()
  const [isPending, setIsPending] = useState(false)
  const defaultCallbackURL = useAuthCallbackUrl()

  async function handleSignIn() {
    const { error } = await tryCatch(
      signIn.social({
        provider,
        callbackURL: callbackURL ?? defaultCallbackURL,
        fetchOptions: {
          onRequest: () => {
            setIsPending(true)
          },
          onError: ({ error }) => {
            toast.error(error.message)
            setIsPending(false)
          },
        },
      }),
    )

    if (error) {
      toast.error(error.message)
      setIsPending(false)
    }
  }

  return (
    <Button size="lg" variant="secondary" isPending={isPending} onClick={handleSignIn} {...props}>
      {t("forms.sign_in.continue_with", { provider: capitalCase(provider) })}
    </Button>
  )
}
