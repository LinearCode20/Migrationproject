"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cx } from "~/lib/utils"

export function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cx(
        "peer inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent! shadow-xs",
        "relative after:absolute after:-inset-1",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "data-checked:bg-primary data-unchecked:bg-foreground/50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-3 rounded-full bg-background shadow-lg ring-0 transition-transform data-checked:translate-x-3 data-unchecked:translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}
