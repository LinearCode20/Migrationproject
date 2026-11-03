"use client"

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { ChevronDownIcon } from "lucide-react"
import { Card } from "~/components/common/card"
import { cx } from "~/lib/utils"

/**
 * Closed panels stay in the document as `hidden="until-found"`, so the browser's find-in-page
 * opens them and crawlers read every answer, which FAQ structured data relies on.
 */
export function Accordion({
  className,
  hiddenUntilFound = true,
  ...props
}: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      hiddenUntilFound={hiddenUntilFound}
      className={cx("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

/**
 * The item outlines itself while its trigger is hovered, like an interactive card. Only the
 * trigger toggles the item, so hovering the open panel leaves the border alone.
 */
export function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <Card
      className={cx("gap-0 p-0 has-[[data-slot=accordion-trigger]:hover]:border-ring", className)}
      render={<AccordionPrimitive.Item data-slot="accordion-item" {...props} />}
    />
  )
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex w-full">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cx(
          "group/accordion-trigger flex flex-1 cursor-pointer items-start justify-between gap-4 rounded-[calc(var(--radius-lg)-1px)] p-5 text-left text-sm font-medium sm:text-base",
          "data-disabled:pointer-events-none data-disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}

        <ChevronDownIcon
          aria-hidden
          className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-[rotate] duration-250 ease-out-quint group-data-panel-open/accordion-trigger:rotate-180 sm:size-5"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

/**
 * The divider sits on the inner content because Base UI measures the panel without its border,
 * so a bordered panel would end the animation a pixel short. The duration is an arbitrary
 * property because a `duration-*` class also sets `animation-duration` through
 * tailwindcss-animate, which Base UI reads as a second animation.
 */
export function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className={cx(
        "h-(--accordion-panel-height) w-full overflow-hidden text-sm text-pretty",
        "transition-[height,opacity] ease-out-quint [transition-duration:250ms]",
        "data-starting-style:h-0 data-starting-style:opacity-0 data-ending-style:h-0 data-ending-style:opacity-0",
      )}
      {...props}
    >
      <div className={cx("border-t p-5", className)}>{children}</div>
    </AccordionPrimitive.Panel>
  )
}
