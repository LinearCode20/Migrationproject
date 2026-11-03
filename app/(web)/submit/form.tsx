"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { type ComponentProps, type ReactNode, useState } from "react"
import { FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import { FieldError, FormField } from "~/components/common/field"
import { Input } from "~/components/common/input"
import { TextArea } from "~/components/common/textarea"
import { LoginDialog } from "~/components/web/auth/login-dialog"
import { FeatureNudge } from "~/components/web/feature-nudge"
import { useFormDraft } from "~/hooks/use-form-draft"
import { useTrackEvent } from "~/hooks/use-track-event"
import { useSession } from "~/lib/auth-client"
import { orpc } from "~/lib/orpc-query"
import { isToolPublished, isToolTopTier } from "~/lib/tools"
import { cx } from "~/lib/utils"
import { createSubmitToolSchema } from "~/server/shared/form-schemas"

interface SubmitFormProps extends ComponentProps<"form"> {
  /** A line under the submit button, such as the price and queue hint. */
  note?: ReactNode
}

export function SubmitForm({ note, className, ...props }: SubmitFormProps) {
  const router = useRouter()
  const trackEvent = useTrackEvent()
  const t = useTranslations("forms.submit")
  const tSchema = useTranslations("schema")
  const { data: session } = useSession()
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const schema = createSubmitToolSchema(tSchema)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      websiteUrl: "",
      submitterNote: "",
    },
  })

  // A guest's typed values wait in the browser while they sign in, so they are back in the
  // form when the magic link or the OAuth redirect returns to this page.
  const { saveDraft, clearDraft } = useFormDraft(form, "submit")

  const mutation = useMutation(
    orpc.tools.submit.mutationOptions({
      onSuccess: data => {
        form.reset()
        clearDraft()

        trackEvent("submit_tool", { slug: data.slug })

        if (isToolPublished(data)) {
          if (isToolTopTier(data)) {
            toast.info(t("already_published", { name: data.name }))
          } else {
            toast.custom(toastId => <FeatureNudge tool={data} toastId={toastId} />, {
              duration: Number.POSITIVE_INFINITY,
            })
          }
          router.push(`/${data.slug}`)
        } else {
          toast.success(t("submitted_success", { name: data.name }))
          router.push(`/submit/${data.slug}`)
        }
      },
    }),
  )

  // A guest signs in first and then submits again, so opening a link never creates a submission.
  const onSubmit = form.handleSubmit(data => {
    if (!session?.user) {
      saveDraft()
      setShowLoginDialog(true)
      return
    }

    mutation.mutate(data)
  })

  return (
    <Form {...form}>
      <form
        noValidate
        className={cx("grid w-full gap-5 @md:grid-cols-2", className)}
        onSubmit={onSubmit}
        {...props}
      >
        <FormField control={form.control} name="name" label={`${t("name_label")}:`} required>
          <Input size="lg" placeholder={t("name_placeholder")} data-1p-ignore />
        </FormField>

        <FormField
          control={form.control}
          name="websiteUrl"
          label={`${t("website_label")}:`}
          required
        >
          <Input type="url" size="lg" placeholder={t("website_placeholder")} />
        </FormField>

        <FormField
          control={form.control}
          name="submitterNote"
          label={`${t("note_label")}:`}
          className="col-span-full"
        >
          <TextArea size="lg" placeholder={t("note_placeholder")} />
        </FormField>

        <FieldError role="alert" errors={[mutation.error ?? undefined]} className="col-span-full" />

        <div className="col-span-full grid justify-items-start gap-3">
          <Button
            type="submit"
            variant="primary"
            isPending={mutation.isPending}
            className="flex min-w-32"
          >
            {t("submit_button")}
          </Button>

          {note}
        </div>
      </form>

      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        description={t("sign_in_description", { name: form.getValues("name") })}
      />
    </Form>
  )
}
