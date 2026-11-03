export { tv as cva, cn as cx } from "tailwind-variants"
export type { VariantProps } from "tailwind-variants"

/**
 * How a popup comes and goes: a quick enter on the `ease-out-expo` curve, a plainer exit, a
 * barely-there zoom and a 2px slide away from the trigger. `data-instant` is Base UI asking for
 * no animation at all, such as keyboard navigation between menu items.
 */
export const popoverAnimationClasses = [
  "origin-(--transform-origin) data-instant:duration-0",
  "data-open:duration-100 data-open:animate-in data-open:ease-out-expo data-open:fade-in-0 data-open:zoom-in-98",
  "data-closed:duration-150 data-closed:animate-out data-closed:ease-out data-closed:fade-out-0 data-closed:zoom-out-98",
  "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2",
  "data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-2",
  "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-2",
  "data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
]

/** The panel every menu, select, popover and hover card is drawn on. */
export const popupSurfaceClasses =
  "rounded-md border bg-popover text-popover-foreground shadow-popup outline-hidden"

/**
 * One row in any floating list, lit by `focus` (Menu, Select) or `data-highlighted`. cmdk marks
 * its active row with `aria-selected` instead, which a Base UI select also sets on the chosen
 * option, so the command list adds that state itself. Each list adds its own disabled state,
 * since cmdk writes `data-disabled="false"`.
 */
export const popupItemClasses = [
  "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden",
  "focus:bg-accent focus:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground",
  "[&>svg]:size-4 [&>svg]:shrink-0",
]

/** The heading over a group of rows in a floating list (Menu, Select). */
export const popupLabelClasses = "px-2 py-1.5 text-sm font-medium"

export const popupSeparatorClasses = "-mx-1 my-1 h-px bg-border"
