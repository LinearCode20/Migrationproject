"use client"

import { InboxIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import type { ComponentProps } from "react"
import { FormProvider as Form } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import { FormField } from "~/components/common/field"
import { Input } from "~/components/common/input"
import { Stack } from "~/components/common/stack"
import { useMagicLink } from "~/hooks/use-magic-link"

interface LoginFormProps extends ComponentProps<"form"> {
  callbackURL?: string
}

export function LoginForm({ callbackURL, ...props }: LoginFormProps) {
  const t = useTranslations()
  const router = useRouter()

  const { form, handleSignIn, isPending } = useMagicLink({
    callbackURL,

    onSuccess: email => {
      router.push(`/auth/verify?email=${encodeURIComponent(email)}`)
    },

    onError: error => {
      toast.error(error.message)
    },
  })

  return (
    <Form {...form}>
      <Stack
        direction="column"
        render={<form noValidate onSubmit={form.handleSubmit(handleSignIn)} {...props} />}
        className="items-stretch"
      >
        <FormField
          control={form.control}
          name="email"
          label={t("forms.sign_in.email_label")}
          labelClassName="sr-only"
        >
          <Input
            type="email"
            size="lg"
            placeholder={t("forms.sign_in.email_placeholder")}
            data-1p-ignore
          />
        </FormField>

        <Button type="submit" suffix={<InboxIcon />} isPending={isPending}>
          {t("forms.sign_in.magic_link_button")}
        </Button>
      </Stack>
    </Form>
  )
}
