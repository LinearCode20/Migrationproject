import { getDomain } from "@dirstack/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"
import { Button } from "~/components/common/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/common/dialog"
import { FormField } from "~/components/common/field"
import { Input } from "~/components/common/input"
import { Stack } from "~/components/common/stack"
import { LoginDialog } from "~/components/web/auth/login-dialog"
import { siteConfig } from "~/config/site"
import { verificationsConfig } from "~/config/verifications"
import { useSession } from "~/lib/auth-client"
import { orpc } from "~/lib/orpc-query"
import { isEmailOnDomain, isUserOnDomain } from "~/lib/tools"
import {
  createVerifyToolEmailSchema,
  createVerifyToolOtpSchema,
} from "~/server/shared/form-schemas"
import type { ToolOne } from "~/server/tools/payloads"

interface ToolVerifyDialogProps {
  tool: ToolOne
  /** The owner already manages the listing, so verifying only adds the badge. */
  isOwner?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ToolVerifyDialog({ tool, isOwner, open, onOpenChange }: ToolVerifyDialogProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations("dialogs.verify")
  const tSchema = useTranslations("schema")
  const [step, setStep] = useState<"email" | "otp">("email")
  const [verificationEmail, setVerificationEmail] = useState("")
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  const emailSchema = createVerifyToolEmailSchema(tSchema)
  const otpSchema = createVerifyToolOtpSchema(tSchema)

  const toolDomain = getDomain(tool.websiteUrl)

  // Signing in already proved control of the account's inbox, so an account email on the
  // tool's domain verifies the tool without a code.
  const currentStep = isUserOnDomain(session?.user, tool.websiteUrl) ? "account" : step

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      toolId: tool.id,
      email: "",
    },
  })

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      toolId: tool.id,
      otp: "",
    },
  })

  const sendOtpMutation = useMutation(
    orpc.tools.sendVerificationOtp.mutationOptions({
      onSuccess: () => {
        toast.success(t("otp_sent"))
        setVerificationEmail(emailForm.getValues().email)
        setStep("otp")
        setCooldownRemaining(verificationsConfig.resendCooldown)
      },

      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  // Reloads the page data and the listing actions, so the badge and the owner's actions show
  // without a manual reload.
  function handleVerified() {
    toast.success(t("success_message", { toolName: tool.name }))
    void queryClient.invalidateQueries({ queryKey: orpc.tools.access.key() })
    router.replace(`/${tool.slug}`)
    router.refresh()
  }

  function handleVerifyError(error: Error) {
    toast.error(error.message)
  }

  const verifyOtpMutation = useMutation(
    orpc.tools.confirmVerificationOtp.mutationOptions({
      onSuccess: handleVerified,
      onError: handleVerifyError,
    }),
  )

  const verifyWithAccountMutation = useMutation(
    orpc.tools.verifyWithAccountEmail.mutationOptions({
      onSuccess: handleVerified,
      onError: handleVerifyError,
    }),
  )

  useEffect(() => {
    if (cooldownRemaining <= 0) {
      return
    }

    const interval = setInterval(() => {
      setCooldownRemaining(previous => (previous > 0 ? previous - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [cooldownRemaining])

  function handleOpenChange(open: boolean) {
    if (!open) {
      setStep("email")
      emailForm.reset()
      otpForm.reset()
      setVerificationEmail("")
      setCooldownRemaining(0)
    }

    onOpenChange(open)
  }

  function handleEmailSubmit({ email }: z.infer<typeof emailSchema>) {
    if (!isEmailOnDomain(email, tool.websiteUrl)) {
      emailForm.setError("email", {
        type: "manual",
        message: t("email_domain_error", { domain: toolDomain }),
      })

      return
    }

    sendOtpMutation.mutate(emailForm.getValues())
  }

  function handleResendOtp() {
    if (cooldownRemaining > 0 || sendOtpMutation.isPending) {
      return
    }

    emailForm.setValue("email", verificationEmail)
    sendOtpMutation.mutate(emailForm.getValues())
  }

  function getResendButtonText() {
    if (cooldownRemaining > 0) {
      return t("resend_in", { seconds: cooldownRemaining })
    }

    return t("resend_code")
  }

  if (!session?.user) {
    return (
      <LoginDialog
        open={open}
        onOpenChange={onOpenChange}
        description={t("sign_in", { toolName: tool.name, domain: toolDomain })}
      />
    )
  }

  const benefits = isOwner ? (
    <p>{t("owner_benefit", { toolName: tool.name })}</p>
  ) : (
    <>
      <p>{t("benefits_title")}</p>

      <ul className="mt-2 list-disc pl-4">
        <li>{t("benefit_update")}</li>
        <li>{t("benefit_manage")}</li>
        <li>{t("benefit_upgrade", { siteName: siteConfig.name })}</li>
      </ul>
    </>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            {isOwner
              ? t("owner_title", { toolName: tool.name })
              : t("title", { toolName: tool.name })}
          </DialogTitle>
        </DialogHeader>

        {currentStep === "account" && (
          <div className="space-y-6">
            <DialogDescription>
              <p>{t("account_intro", { email: session.user.email, domain: toolDomain })}</p>

              {benefits}
            </DialogDescription>

            <DialogFooter>
              <Button variant="secondary" onClick={() => handleOpenChange(false)}>
                {t("cancel_button")}
              </Button>

              <Button
                isPending={verifyWithAccountMutation.isPending}
                className="min-w-28"
                onClick={() => verifyWithAccountMutation.mutate({ id: tool.id })}
              >
                {t("verify_button", { toolName: tool.name })}
              </Button>
            </DialogFooter>
          </div>
        )}

        {currentStep === "email" && (
          <Form {...emailForm}>
            <form
              noValidate
              className="space-y-6"
              onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
            >
              <DialogDescription>
                <p>{t("intro", { domain: toolDomain })}</p>

                {benefits}
              </DialogDescription>

              <FormField control={emailForm.control} name="email" label={t("email_label")} required>
                <Input
                  type="email"
                  data-1p-ignore
                  placeholder={t("email_placeholder", { domain: toolDomain })}
                />
              </FormField>

              <DialogFooter>
                <Button variant="secondary" onClick={() => handleOpenChange(false)}>
                  {t("cancel_button")}
                </Button>

                <Button type="submit" isPending={sendOtpMutation.isPending} className="min-w-28">
                  {t("send_code_button")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {currentStep === "otp" && (
          <Form {...otpForm}>
            <form
              noValidate
              className="space-y-6"
              onSubmit={otpForm.handleSubmit(data => verifyOtpMutation.mutate(data))}
            >
              <DialogDescription>
                <p>{t("verification_intro", { email: verificationEmail })}</p>
              </DialogDescription>

              <Stack direction="column">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  label={t("verification_label")}
                  required
                >
                  <Input
                    placeholder={t("verification_placeholder", {
                      length: verificationsConfig.otpLength,
                    })}
                  />
                </FormField>

                <Stack size="sm" className="w-full justify-between">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setStep("email")
                      otpForm.reset()
                    }}
                  >
                    {t("change_email_button")}
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    isPending={sendOtpMutation.isPending}
                    disabled={cooldownRemaining > 0}
                    onClick={handleResendOtp}
                  >
                    {getResendButtonText()}
                  </Button>
                </Stack>
              </Stack>

              <DialogFooter>
                <Button variant="secondary" onClick={() => handleOpenChange(false)}>
                  {t("cancel_button")}
                </Button>

                <Button type="submit" isPending={verifyOtpMutation.isPending} className="min-w-28">
                  {t("verify_button", { toolName: tool.name })}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
