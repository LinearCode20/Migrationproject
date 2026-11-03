"use client"

import { Select as SelectPrimitive } from "@base-ui/react/select"
import { CheckIcon, ChevronDownIcon, ChevronsUpDownIcon, ChevronUpIcon } from "lucide-react"
import type { ComponentProps } from "react"
import { inputVariants } from "~/components/common/input"
import {
  cva,
  cx,
  popoverAnimationClasses,
  popupItemClasses,
  popupLabelClasses,
  popupSurfaceClasses,
  type VariantProps,
} from "~/lib/utils"

export function Select(props: ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

export function SelectGroup(props: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

export function SelectValue(props: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

export function SelectTrigger({
  children,
  className,
  interactive = true,
  size,
  ...props
}: SelectPrimitive.Trigger.Props & VariantProps<typeof inputVariants>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cx(
        inputVariants({ interactive, size }),
        "flex items-center justify-between gap-1 data-placeholder:text-muted-foreground *:data-[slot=select-value]:truncate",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon render={<ChevronsUpDownIcon className="shrink-0 opacity-50" />} />
    </SelectPrimitive.Trigger>
  )
}

function SelectScrollUpButton({ className, ...props }: SelectPrimitive.ScrollUpArrow.Props) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cx("flex cursor-pointer items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({ className, ...props }: SelectPrimitive.ScrollDownArrow.Props) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cx("flex cursor-pointer items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  )
}

const selectScrollButtonVariants = cva({
  base: "absolute inset-x-0 z-10 bg-popover animate-in fade-in-0 duration-300",
  variants: {
    position: {
      top: "top-0 mask-b-from-0",
      bottom: "bottom-0 mask-t-from-0",
    },
  },
})

export function SelectContent({
  className,
  children,
  align,
  side,
  sideOffset = 4,
  alignItemWithTrigger = false,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        sideOffset={sideOffset}
        align={align}
        side={side}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cx(
            popupSurfaceClasses,
            "relative isolate max-h-(--available-height) min-w-(--anchor-width) overflow-x-hidden overflow-y-auto",
            !alignItemWithTrigger && popoverAnimationClasses,
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton className={selectScrollButtonVariants({ position: "top" })} />
          <SelectPrimitive.List className="p-1">{children}</SelectPrimitive.List>
          <SelectScrollDownButton className={selectScrollButtonVariants({ position: "bottom" })} />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

export function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cx(popupLabelClasses, className)}
      {...props}
    />
  )
}

export function SelectItem({ className, children, label, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      label={label ?? (typeof children === "string" ? children : undefined)}
      className={cx(
        popupItemClasses,
        "pr-8 data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span
        data-slot="select-item-indicator"
        className="absolute right-2 flex size-3.5 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
