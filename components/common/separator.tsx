import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cx } from "~/lib/utils"

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cx(
        "shrink-0 self-stretch bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  )
}
