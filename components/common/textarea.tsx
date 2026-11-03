import type { ComponentProps } from "react"
import { inputVariants } from "~/components/common/input"
import { cx, type VariantProps } from "~/lib/utils"

interface TextAreaProps
  extends Omit<ComponentProps<"textarea">, "size">, VariantProps<typeof inputVariants> {}

export function TextArea({ className, interactive, size, ...props }: TextAreaProps) {
  return (
    <textarea
      className={cx(
        inputVariants({ interactive, size }),
        "leading-normal! resize-y field-sizing-content",
        className,
      )}
      {...props}
    />
  )
}
