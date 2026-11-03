import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { FormProvider as Form, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { ReportType } from "~/.generated/prisma/browser"
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
import { Label } from "~/components/common/label"
import { RadioGroup, RadioGroupItem } from "~/components/common/radio-group"
import { Stack } from "~/components/common/stack"
import { TextArea } from "~/components/common/textarea"
import { LoginDialog } from "~/components/web/auth/login-dialog"
import { reportsConfig } from "~/config/reports"
import { useSession } from "~/lib/auth-client"
import { orpc } from "~/lib/orpc-query"
import { createReportToolSchema } from "~/server/shared/form-schemas"
import type { ToolOne } from "~/server/tools/payloads"

interface ToolReportDialogProps {
  tool: ToolOne
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ToolReportDialog({ tool, open, onOpenChange }: ToolReportDialogProps) {
  const { data: session } = useSession()
  const t = useTranslations("dialogs.report")
  const tSchema = useTranslations("schema")

  const schema = createReportToolSchema(tSchema)

  const form = useForm({
    resolver: zodResolver(schema),
    values: {
      type: "" as unknown as ReportType,
      message: "",
      toolId: tool.id,
      email: session?.user.email ?? "",
    },
  })

  const mutation = useMutation(
    orpc.reports.create.mutationOptions({
      onSuccess: () => {
        toast.success(t("success_message"))
        onOpenChange(false)
        form.reset()
      },
      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const type = useWatch({ control: form.control, name: "type" })
  const onSubmit = form.handleSubmit(data => mutation.mutate(data))

  useHotkeys([["mod+enter", () => onSubmit()]], [], true)

  if (!reportsConfig.enabled) {
    return null
  }

  if (reportsConfig.requireSignIn && !session?.user) {
    return <LoginDialog open={open} onOpenChange={onOpenChange} />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("title", { toolName: tool.name })}</DialogTitle>
          <DialogDescription>{t("question")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form noValidate className="grid gap-4" onSubmit={onSubmit}>
            {!session?.user && (
              <FormField control={form.control} name="email" label={t("email_label")} required>
                <Input type="email" placeholder={t("email_placeholder")} data-1p-ignore />
              </FormField>
            )}

            <FormField control={form.control} name="type" label={t("type_label")} required>
              {({ field, controlProps }) => (
                <RadioGroup
                  {...controlProps}
                  value={field.value}
                  className="flex flex-col items-start gap-2.5"
                  onValueChange={field.onChange}
                >
                  {Object.values(ReportType).map(type => (
                    <Stack key={type} size="sm" wrap={false}>
                      <RadioGroupItem id={type} value={type} />
                      <Label htmlFor={type} className="font-normal opacity-75">
                        {t(`types.${type}`)}
                      </Label>
                    </Stack>
                  ))}
                </RadioGroup>
              )}
            </FormField>

            <FormField
              control={form.control}
              name="message"
              label={t("message_label")}
              required={type === ReportType.Other}
            >
              <TextArea placeholder={t("message_placeholder")} className="min-h-20" />
            </FormField>

            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                {t("cancel_button")}
              </Button>

              <Button type="submit" isPending={mutation.isPending} className="min-w-28">
                {t("send_button")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
