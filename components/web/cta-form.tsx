"use client"

import { isTruthy } from "@dirstack/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { type ComponentProps, useId } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { boxVariants } from "~/components/common/box"
import { Button } from "~/components/common/button"
import { FieldError } from "~/components/common/field"
import { Input } from "~/components/common/input"
import { useTrackEvent } from "~/hooks/use-track-event"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import { createNewsletterSchema } from "~/server/shared/form-schemas"

type ButtonProps = ComponentProps<typeof Button>
type InputProps = ComponentProps<typeof Input>

interface CTAFormProps extends ComponentProps<"form"> {
  /** Placement name sent with the tracking event, such as `footer` or `tool_sidebar`. */
  source: string
  size?: Extract<InputProps["size"], "md" | "lg">
  buttonProps?: ButtonProps
}

export function CTAForm({
  children,
  className,
  source,
  size = "md",
  buttonProps,
  ...props
}: CTAFormProps) {
  const t = useTranslations("forms.subscribe")
  const tSchema = useTranslations("schema")
  const trackEvent = useTrackEvent()
  const errorId = useId()

  const schema = createNewsletterSchema(tSchema)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      captcha: "" as const,
      email: "",
    },
  })

  const mutation = useMutation(
    orpc.subscribe.subscribe.mutationOptions({
      onSuccess: () => {
        trackEvent("subscribe_newsletter", { source })
        form.reset()
      },
    }),
  )

  const onSubmit = form.handleSubmit(data => mutation.mutate(data))

  const defaultButtonProps = buttonProps ?? { size: "sm" }
  const errors = [mutation.error, form.formState.errors.email].filter(isTruthy)
  const hasError = errors.length > 0

  return (
    <Form {...form}>
      <form
        noValidate
        className={cx("flex flex-col gap-3 w-full", className)}
        onSubmit={onSubmit}
        {...props}
      >
        <Controller
          control={form.control}
          name="captcha"
          render={({ field }) => <input type="hidden" {...field} />}
        />

        <div
          className={cx(boxVariants({ fieldFocus: true }), "flex w-full bg-background rounded-lg")}
        >
          <Controller
            control={form.control}
            name="email"
            render={({ field }) => (
              <Input
                type="email"
                placeholder={t("email_placeholder")}
                aria-label={t("email_placeholder")}
                aria-invalid={hasError || undefined}
                aria-describedby={hasError ? errorId : undefined}
                size={size}
                data-1p-ignore
                className="flex-1 min-w-0 border-0 focus-visible:outline-none"
                {...field}
              />
            )}
          />

          <Button
            type="submit"
            isPending={mutation.isPending}
            className={cx(
              "shrink-0",
              size === "lg" ? "text-sm/tight px-4 py-2 m-1" : "px-3 py-1.5 m-0.5",
            )}
            {...defaultButtonProps}
          >
            {t(`button_${size}`)}
          </Button>
        </div>

        <FieldError id={errorId} errors={errors} className="-mt-1 text-xs font-medium" />

        {mutation.isSuccess && (
          <output className="block text-sm text-success-text">{t("success_message")}</output>
        )}

        {children}
      </form>
    </Form>
  )
}
