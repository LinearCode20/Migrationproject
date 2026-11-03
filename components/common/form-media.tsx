import { isValidUrl } from "@dirstack/utils"
import { capitalCase } from "change-case"
import { DownloadCloudIcon, UploadIcon } from "lucide-react"
import { type ComponentProps, useId, useRef } from "react"
import type { ControllerRenderProps, FieldPath, FieldValues, UseFormReturn } from "react-hook-form"
import { Button } from "~/components/common/button"
import { ButtonGroup } from "~/components/common/button-group"
import { DisabledReason } from "~/components/common/disabled-reason"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { Input } from "~/components/common/input"
import { Stack } from "~/components/common/stack"
import { useCan } from "~/contexts/user-context"
import { useMediaAction } from "~/hooks/use-media-action"
import { cx } from "~/lib/utils"
import { ALLOWED_MIMETYPES } from "~/server/shared/media/schema"

interface FormMediaProps<T extends FieldValues> extends ComponentProps<typeof Field> {
  form: UseFormReturn<T>
  field: ControllerRenderProps<T, FieldPath<T>>
  path: string
  fetchType?: "favicon" | "screenshot"
  websiteUrl?: string
}

export function FormMedia<T extends FieldValues>({
  children,
  className,
  form,
  field,
  path,
  fetchType,
  websiteUrl,
  ...props
}: FormMediaProps<T>) {
  const id = useId()
  const errorId = `${id}-error`
  const inputRef = useRef<HTMLInputElement>(null)
  const action = useMediaAction({ form, path, fieldName: field.name, fetchType })
  const canWriteMedia = useCan("media.write")

  const { error } = form.getFieldState(field.name, form.formState)

  return (
    <Field className={cx("items-stretch", className)} {...props}>
      <Stack className="justify-between">
        <FieldLabel htmlFor={id}>{capitalCase(field.name)}</FieldLabel>

        <ButtonGroup className="-my-1">
          <Button
            size="sm"
            variant="secondary"
            prefix={<UploadIcon />}
            isPending={action.isUploading}
            disabled={!canWriteMedia || action.isUploading || action.isFetching}
            onClick={() => inputRef.current?.click()}
          >
            Upload
          </Button>

          {websiteUrl !== undefined && (
            <DisabledReason
              reason={canWriteMedia && !isValidUrl(websiteUrl) && "Enter a valid website URL first"}
            >
              <Button
                size="sm"
                variant="secondary"
                prefix={<DownloadCloudIcon />}
                isPending={action.isFetching}
                disabled={!canWriteMedia || action.isUploading || action.isFetching}
                onClick={() => action.handleFetch(websiteUrl)}
              >
                Fetch
              </Button>
            </DisabledReason>
          )}
        </ButtonGroup>
      </Stack>

      <Stack size="xs">
        <Input
          id={id}
          type="url"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="flex-1"
          {...field}
        />

        {children}
      </Stack>

      {error && <FieldError id={errorId} errors={[error]} />}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_MIMETYPES.join(",")}
        className="hidden"
        onChange={action.handleUpload}
      />
    </Field>
  )
}
