"use client"

import { mergeProps } from "@base-ui/react"
import { uniq } from "@dirstack/utils"
import {
  type ComponentProps,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
} from "react"
import {
  type Control,
  Controller,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { Label } from "~/components/common/label"
import { Stack } from "~/components/common/stack"
import { cva, cx, type VariantProps } from "~/lib/utils"

const fieldVariants = cva({
  base: "data-[invalid=true]:text-destructive-text gap-2 group/field flex w-full min-w-0",
  variants: {
    orientation: {
      vertical: "flex-col [&>.sr-only]:w-auto",
      horizontal: "flex-row items-center",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
})

export function Field({
  className,
  orientation = "vertical",
  ...props
}: ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      data-slot="field"
      data-orientation={orientation}
      className={cx(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

export function FieldLabel({ className, ...props }: ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cx(
        "gap-2 group-data-[disabled=true]/field:opacity-50 flex w-fit leading-snug",
        "data-required:after:-ml-1.5 data-required:after:text-destructive-text data-required:after:content-['*'_/_'']",
        className,
      )}
      {...props}
    />
  )
}

interface FieldErrorProps extends ComponentProps<"div"> {
  errors?: ({ message?: string } | undefined)[]
}

export function FieldError({ className, children, errors = [], ...props }: FieldErrorProps) {
  const messages = uniq(errors.flatMap(error => error?.message ?? []))

  const content =
    children ??
    (messages.length > 1 ? (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {messages.map(message => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    ) : (
      messages[0]
    ))

  if (!content) {
    return null
  }

  return (
    <div
      data-slot="field-error"
      className={cx("text-destructive-text text-sm font-normal", className)}
      {...props}
    >
      {content}
    </div>
  )
}

/** What a control needs to belong to its field: the id, its label, and the copy under it. */
export interface FormFieldControlProps {
  id: string
  "aria-labelledby": string
  "aria-describedby"?: string
  "aria-invalid"?: true
  "aria-required"?: true
}

interface FormFieldRenderProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  field: ControllerRenderProps<TFieldValues, TName>
  fieldState: ControllerFieldState
  controlProps: FormFieldControlProps
}

interface FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<ComponentProps<typeof Field>, "children"> {
  control: Control<TFieldValues>
  name: TName
  label: ReactNode
  labelClassName?: string
  /** At the end of the label's line: a character limit, a hint, an action. */
  labelSuffix?: ReactNode
  /** Under the control, and read out with it. */
  description?: ReactNode
  required?: boolean
  /**
   * The control. An element takes the field's value, handlers and aria attributes as props; a
   * function hands them over for a control with its own value API (a checkbox, a select).
   */
  children: ReactElement | ((props: FormFieldRenderProps<TFieldValues, TName>) => ReactNode)
}

/**
 * One react-hook-form field: label, control, description and the first validation error, with
 * the control's id, `aria-describedby`, `aria-invalid` and `aria-required` wired to them. A
 * horizontal field puts the control before its label, as a checkbox or a switch reads.
 */
export function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  labelClassName,
  labelSuffix,
  description,
  required,
  orientation,
  children,
  ...props
}: FormFieldProps<TFieldValues, TName>) {
  const id = useId()
  const labelId = `${id}-label`
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const describedBy = [description && descriptionId, fieldState.invalid && errorId]
          .filter(Boolean)
          .join(" ")

        const controlProps: FormFieldControlProps = {
          id,
          "aria-labelledby": labelId,
          "aria-describedby": describedBy || undefined,
          "aria-invalid": fieldState.invalid || undefined,
          "aria-required": required || undefined,
        }

        const element =
          typeof children === "function"
            ? children({ field, fieldState, controlProps })
            : isValidElement<Record<string, unknown>>(children) &&
              cloneElement(children, mergeProps({ ...field, ...controlProps }, children.props))

        const labelElement = (
          <FieldLabel
            id={labelId}
            htmlFor={id}
            data-required={required || undefined}
            className={labelClassName}
          >
            {label}
          </FieldLabel>
        )

        return (
          <Field data-invalid={fieldState.invalid} orientation={orientation} {...props}>
            {orientation === "horizontal" && element}

            {labelSuffix ? (
              <Stack className="w-full justify-between">
                {labelElement}
                {labelSuffix}
              </Stack>
            ) : (
              labelElement
            )}

            {orientation !== "horizontal" && element}

            {description && (
              <p id={descriptionId} className="text-xs text-muted-foreground">
                {description}
              </p>
            )}

            {fieldState.invalid && <FieldError id={errorId} errors={[fieldState.error]} />}
          </Field>
        )
      }}
    />
  )
}
