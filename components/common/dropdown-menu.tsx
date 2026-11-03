"use client"

import { Menu } from "@base-ui/react/menu"
import { CheckIcon, ChevronRightIcon } from "lucide-react"
import {
  cx,
  popoverAnimationClasses,
  popupItemClasses,
  popupLabelClasses,
  popupSeparatorClasses,
  popupSurfaceClasses,
} from "~/lib/utils"

/**
 * Menu rows rest in the muted colour with dimmed icons and brighten when highlighted, the
 * same look as the header navigation, so a menu reads as quiet navigation.
 */
const menuRowClasses =
  "text-muted-foreground [&>svg]:opacity-75 focus:[&>svg]:opacity-100 data-highlighted:[&>svg]:opacity-100"

export function DropdownMenu(props: Menu.Root.Props) {
  return <Menu.Root data-slot="dropdown-menu" {...props} />
}

export function DropdownMenuTrigger(props: Menu.Trigger.Props) {
  return <Menu.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

export function DropdownMenuGroup(props: Menu.Group.Props) {
  return <Menu.Group data-slot="dropdown-menu-group" {...props} />
}

export function DropdownMenuSub(props: Menu.SubmenuRoot.Props) {
  return <Menu.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

export function DropdownMenuRadioGroup(props: Menu.RadioGroup.Props) {
  return <Menu.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

export function DropdownMenuContent({
  className,
  sideOffset = 4,
  align,
  side,
  ...props
}: Menu.Popup.Props & Pick<Menu.Positioner.Props, "align" | "side" | "sideOffset">) {
  return (
    <Menu.Portal>
      <Menu.Positioner sideOffset={sideOffset} align={align} side={side} className="isolate z-50">
        <Menu.Popup
          data-slot="dropdown-menu-content"
          className={cx(
            popupSurfaceClasses,
            "min-w-40 flex flex-col p-1",
            popoverAnimationClasses,
            className,
          )}
          {...props}
        />
      </Menu.Positioner>
    </Menu.Portal>
  )
}

interface DropdownMenuItemProps extends Menu.Item.Props {
  variant?: "default" | "destructive"
}

export function DropdownMenuItem({ className, variant, ...props }: DropdownMenuItemProps) {
  return (
    <Menu.Item
      data-slot="dropdown-menu-item"
      data-variant={variant}
      className={cx(
        popupItemClasses,
        menuRowClasses,
        // Reset for an item rendered as a padded link (`NavLink`), whose negative margin would
        // otherwise pull the rows together.
        "m-0 data-disabled:pointer-events-none data-disabled:opacity-50",
        variant === "destructive" &&
          "text-destructive-text focus:bg-destructive-tint/(--tint-alpha) focus:text-destructive-text data-highlighted:bg-destructive-tint/(--tint-alpha) data-highlighted:text-destructive-text [&>svg]:text-destructive-text",
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuRadioItem({ className, children, ...props }: Menu.RadioItem.Props) {
  return (
    <Menu.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cx(
        popupItemClasses,
        menuRowClasses,
        "pr-8 data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <Menu.RadioItemIndicator>
          <CheckIcon />
        </Menu.RadioItemIndicator>
      </span>
    </Menu.RadioItem>
  )
}

export function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: Menu.SubmenuTrigger.Props) {
  return (
    <Menu.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      className={cx(
        popupItemClasses,
        menuRowClasses,
        "data-open:bg-accent data-open:text-accent-foreground data-open:[&>svg]:opacity-100 data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </Menu.SubmenuTrigger>
  )
}

export function DropdownMenuSubContent({ className, ...props }: Menu.Popup.Props) {
  return (
    <Menu.Portal>
      <Menu.Positioner className="isolate z-50">
        <Menu.Popup
          data-slot="dropdown-menu-sub-content"
          className={cx(popupSurfaceClasses, "min-w-40 p-1", popoverAnimationClasses, className)}
          {...props}
        />
      </Menu.Positioner>
    </Menu.Portal>
  )
}

export function DropdownMenuLabel({ className, ...props }: Menu.GroupLabel.Props) {
  return (
    <Menu.GroupLabel
      data-slot="dropdown-menu-label"
      className={cx(popupLabelClasses, className)}
      {...props}
    />
  )
}

export function DropdownMenuSeparator({ className, ...props }: Menu.Separator.Props) {
  return (
    <Menu.Separator
      data-slot="dropdown-menu-separator"
      className={cx(popupSeparatorClasses, className)}
      {...props}
    />
  )
}
