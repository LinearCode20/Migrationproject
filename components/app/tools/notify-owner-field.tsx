"use client"

import { useFormContext } from "react-hook-form"
import { usePublishActions } from "~/components/app/publish-actions"
import { Checkbox } from "~/components/common/checkbox"
import { FormField } from "~/components/common/field"
import { notifyableStatuses } from "~/config/tool-statuses"
import type { ToolSchema } from "~/server/tools/schema"

/** Offers to email the owner when the selected status change sends one. */
export function NotifyOwnerField() {
  const { status, currentStatus } = usePublishActions()
  const { control } = useFormContext<ToolSchema>()

  if (
    status === currentStatus ||
    !notifyableStatuses.some(notifyable => notifyable === currentStatus)
  ) {
    return null
  }

  return (
    <FormField
      control={control}
      name="notifyOwner"
      label="Notify owner via email"
      orientation="horizontal"
      labelClassName="peer-data-unchecked:font-normal peer-data-unchecked:text-muted-foreground"
      className="gap-1"
    >
      {({ field, controlProps }) => (
        <Checkbox
          {...controlProps}
          checked={field.value}
          onCheckedChange={() => field.onChange(!field.value)}
        />
      )}
    </FormField>
  )
}
