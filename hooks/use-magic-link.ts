import { tryCatch } from "@dirstack/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import type { z } from "zod"
import { useAuthCallbackUrl } from "~/hooks/use-auth-callback-url"
import { signIn } from "~/lib/auth-client"
import { createNewsletterSchema } from "~/server/shared/form-schemas"

interface UseMagicLinkProps {
  /** Overrides the default return URL, for example to carry a pending action. */
  callbackURL?: string
  onSuccess?: (email: string) => void
  onError?: (error: Error) => void
}

export function useMagicLink({ callbackURL, onSuccess, onError }: UseMagicLinkProps = {}) {
  const t = useTranslations("schema")
  const defaultCallbackURL = useAuthCallbackUrl()

  const schema = createNewsletterSchema(t)
  const resolver = zodResolver(schema)
  const defaultValues = { captcha: "", email: "" } as const
  const form = useForm<z.infer<typeof schema>>({ resolver, defaultValues })

  async function handleSignIn({ email }: z.infer<typeof schema>) {
    const { error } = await tryCatch(
      signIn.magicLink({
        email,
        callbackURL: callbackURL ?? defaultCallbackURL,
        fetchOptions: {
          onSuccess: () => {
            form.reset()
            onSuccess?.(email)
          },
          onError: ({ error }) => onError?.(error),
        },
      }),
    )

    if (error) {
      onError?.(error)
    }
  }

  return { form, handleSignIn, isPending: form.formState.isSubmitting }
}
