"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { capitalCase } from "change-case"
import { WrenchIcon } from "lucide-react"
import Link from "next/link"
import type { ComponentProps } from "react"
import { FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { ReportType } from "~/.generated/prisma/browser"
import { EntityFormFooter, EntityFormHeader, EntityFormSubmit } from "~/components/app/entity-form"
import { ReportActions } from "~/components/app/reports/report-actions"
import { Button } from "~/components/common/button"
import { FormField } from "~/components/common/field"
import { Input } from "~/components/common/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/common/select"
import { TextArea } from "~/components/common/textarea"
import { useCan } from "~/contexts/user-context"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findReportById } from "~/server/reports/queries"
import { reportUpdateSchema } from "~/server/reports/schema"

interface ReportFormProps extends ComponentProps<"form"> {
  report: NonNullable<Awaited<ReturnType<typeof findReportById>>>
}

export function ReportForm({ className, title, report, ...props }: ReportFormProps) {
  const queryClient = useQueryClient()
  const canSave = useCan("reports.update")

  const form = useForm({
    resolver: zodResolver(reportUpdateSchema),
    values: {
      id: report.id,
      email: report.email,
      type: report.type,
      message: report.message ?? "",
    },
  })

  const mutation = useMutation(
    orpc.reports.update.mutationOptions({
      onSuccess: () => {
        toast.success("Report successfully updated")
        queryClient.invalidateQueries({ queryKey: orpc.reports.key() })
      },
      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const onSubmit = form.handleSubmit(data => mutation.mutate(data))

  useHotkeys([["mod+enter", () => canSave && onSubmit()]], [], true)

  return (
    <Form {...form}>
      <EntityFormHeader title={title}>
        {report.tool && (
          <Button
            size="md"
            variant="secondary"
            prefix={<WrenchIcon />}
            render={<Link href={`/app/tools/${report.tool.id}`} />}
          >
            View tool
          </Button>
        )}

        <ReportActions report={report} size="md" />
      </EntityFormHeader>

      <form
        noValidate
        className={cx("grid gap-4 @md:grid-cols-2", className)}
        onSubmit={onSubmit}
        {...props}
      >
        <FormField control={form.control} name="type" label="Type" required>
          {({ field, controlProps }) => (
            <Select
              value={field.value}
              items={Object.values(ReportType).map(type => ({
                value: type,
                label: capitalCase(type),
              }))}
              onValueChange={field.onChange}
            >
              <SelectTrigger {...controlProps}>
                <SelectValue placeholder="Select a report type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ReportType).map(type => (
                  <SelectItem key={type} value={type}>
                    {capitalCase(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField control={form.control} name="email" label="Email">
          <Input type="email" data-1p-ignore />
        </FormField>

        <FormField control={form.control} name="message" label="Message" className="col-span-full">
          <TextArea />
        </FormField>

        <EntityFormFooter cancelHref="/app/reports">
          <EntityFormSubmit isPending={mutation.isPending} disabled={!canSave}>
            Update report
          </EntityFormSubmit>
        </EntityFormFooter>
      </form>
    </Form>
  )
}
