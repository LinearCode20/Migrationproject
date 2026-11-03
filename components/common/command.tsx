"use client"

import { Command as CommandPrimitive } from "cmdk-base"
import { SearchIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { Dialog, DialogContent, DialogTitle } from "~/components/common/dialog"
import { inputVariants } from "~/components/common/input"
import { Kbd } from "~/components/common/kbd"
import { Stack } from "~/components/common/stack"
import { slot } from "~/lib/slot"
import { cx, popupItemClasses, popupSeparatorClasses } from "~/lib/utils"

export function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cx(
        "flex size-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className,
      )}
      {...props}
    />
  )
}

interface CommandDialogProps
  extends
    Pick<ComponentProps<typeof Dialog>, "open" | "onOpenChange">,
    ComponentProps<typeof Command> {
  /** The dialog's accessible name, read when it opens. */
  title: string
}

export function CommandDialog({ open, onOpenChange, title, ...props }: CommandDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="overflow-hidden p-0! rounded-md">
        <DialogTitle className="sr-only">{title}</DialogTitle>

        <Command
          className="**:[[cmdk-group]]:p-2 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground/75 **:[[cmdk-input]]:h-12"
          {...props}
        />
      </DialogContent>
    </Dialog>
  )
}

interface CommandInputProps extends Omit<ComponentProps<typeof CommandPrimitive.Input>, "prefix"> {
  prefix?: ReactNode
  suffix?: ReactNode
}

export function CommandInput({ className, prefix, suffix, ...props }: CommandInputProps) {
  return (
    <Stack className={cx("px-3 -mb-px border-b", className)}>
      {slot(prefix ?? <SearchIcon className="opacity-50" />, { className: "size-4 shrink-0" })}

      <CommandPrimitive.Input
        className={cx(inputVariants(), "border-0 px-0 flex-1 truncate text-sm outline-none")}
        {...props}
      />

      {slot(suffix, { className: "shrink-0" })}
    </Stack>
  )
}

export function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cx("max-h-96 overflow-y-auto overscroll-contain", className)}
      {...props}
    />
  )
}

export function CommandEmpty(props: ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty className="py-6 text-center text-sm" {...props} />
}

export function CommandGroup({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cx(
        "overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

export function CommandSeparator({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      className={cx(popupSeparatorClasses, "my-0", className)}
      {...props}
    />
  )
}

export function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cx(
        popupItemClasses,
        "scroll-m-2 aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

interface CommandCheckboxItemProps extends ComponentProps<typeof CommandItem> {
  checked: boolean
}

export function CommandCheckboxItem({ checked, children, ...props }: CommandCheckboxItemProps) {
  return (
    <CommandItem aria-checked={checked} {...props}>
      <input
        type="checkbox"
        checked={checked}
        readOnly
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none"
      />
      {children}
    </CommandItem>
  )
}

export function CommandShortcut({ className, ...props }: ComponentProps<typeof Kbd>) {
  return <Kbd className={cx("ml-auto", className)} {...props} />
}
