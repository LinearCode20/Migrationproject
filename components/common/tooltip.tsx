"use client"

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import type { ReactElement, ReactNode } from "react"
import { cva, cx, type VariantProps } from "~/lib/utils"

/**
 * Tooltip enter and exit motion. It uses transitions instead of keyframes, so a tooltip that
 * reopens mid-close reverses from its current state. It scales up from the arrow while it fades
 * in, and fades out faster without scaling. `data-instant` (keyboard focus, a switch between
 * triggers, a dismissal) skips the transition.
 */
const tooltipAnimationClasses = [
  "origin-(--transform-origin) transition-[opacity,scale] duration-150 ease-out-expo",
  "data-starting-style:opacity-0 data-starting-style:scale-96",
  "data-ending-style:opacity-0 data-ending-style:duration-100 data-ending-style:ease-out",
  "data-instant:transition-none",
]

/**
 * The menu and popover surface. `default` is a single line that wraps only past a wide max width.
 * `rich` is a wider block for a heading over figures. `size` scales the text and padding, and
 * narrows the panel so a longer description wraps into a readable block. `textAlign` aligns
 * that block to the start, the center or the end.
 */
const tooltipVariants = cva({
  base: [
    "relative z-50 rounded-md border bg-popover text-popover-foreground shadow-tooltip text-pretty",
    tooltipAnimationClasses,
  ],

  variants: {
    variant: {
      default: "inline-flex max-w-[min(32rem,calc(100vw-2rem))] items-center gap-2",
      rich: "block min-w-44 max-w-72",
    },
    size: {
      sm: "px-3 py-1.5 text-xs",
      md: "max-w-80 px-4 py-2.5 text-[0.8125rem]",
      lg: "max-w-96 px-5 py-3.5 text-sm",
    },
    textAlign: {
      start: "text-start",
      center: "justify-center text-center",
      end: "justify-end text-end",
    },
  },

  compoundVariants: [{ variant: "rich", size: "sm", className: "py-2" }],

  defaultVariants: {
    variant: "default",
    size: "sm",
    textAlign: "start",
  },
})

/**
 * The arrow is a 12×6 clip of a rotated square with the panel's fill and border, which shows as
 * a wide, shallow triangle. The clip overlaps the panel border by one pixel, so the fill hides
 * the border across the arrow's base and the square's border draws both slanted edges.
 */
function TooltipArrow() {
  return (
    <TooltipPrimitive.Arrow
      className={cx(
        "tooltip-arrow block h-[6px] w-3 overflow-clip",
        "data-[side=bottom]:-top-[6px]",
        "data-[side=top]:-bottom-[6px] data-[side=top]:rotate-180",
        "data-[side=left]:-right-[9px] data-[side=left]:rotate-90",
        "data-[side=right]:-left-[9px] data-[side=right]:-rotate-90",
      )}
    >
      <div className="absolute bottom-0 left-1/2 size-[calc(0.375rem*1.4142)] -translate-x-1/2 translate-y-1/2 rotate-45 rounded-tl-[3px] border bg-popover" />
    </TooltipPrimitive.Arrow>
  )
}

/**
 * The props a trigger passes to the shared popup. Base UI keeps the payload of the active
 * trigger, so the popup updates when the pointer moves to another trigger.
 */
interface TooltipPayload extends VariantProps<typeof tooltipVariants> {
  content: ReactNode
  side: TooltipPrimitive.Positioner.Props["side"]
  className?: string
}

const tooltipHandle = TooltipPrimitive.createHandle<TooltipPayload>()

/**
 * Provides the shared tooltip delay and the single popup that every tooltip uses. When the
 * pointer moves between triggers, the popup moves to the new trigger instead of closing and
 * reopening. That is why `Tooltip` renders only a trigger.
 */
export function TooltipProvider({ children, ...props }: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider {...props}>
      {children}

      {/* Tooltips hold nothing to click, so the popup closes as soon as the pointer leaves the
          trigger. */}
      <TooltipPrimitive.Root handle={tooltipHandle} disableHoverablePopup>
        {({ payload }) => (
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Positioner
              sideOffset={8}
              side={payload?.side}
              className="tooltip-positioner isolate z-50"
            >
              <TooltipPrimitive.Popup
                className={tooltipVariants({
                  variant: payload?.variant,
                  size: payload?.size,
                  textAlign: payload?.textAlign,
                  className: payload?.className,
                })}
              >
                <TooltipArrow />
                {payload?.content}
              </TooltipPrimitive.Popup>
            </TooltipPrimitive.Positioner>
          </TooltipPrimitive.Portal>
        )}
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

interface TooltipProps
  extends Pick<TooltipPrimitive.Positioner.Props, "side">, VariantProps<typeof tooltipVariants> {
  /** The trigger. It takes the tooltip's props, so it has to pass them on to its element. */
  children: ReactElement
  /** What the tooltip says. Left empty, the trigger renders alone. */
  tooltip: ReactNode
  /** Classes for the panel, e.g. a column layout for a stacked label. */
  className?: string
  /** Overrides the provider's delay for this trigger. */
  delay?: number
}

export function Tooltip({
  children,
  tooltip,
  side,
  variant,
  size,
  textAlign,
  className,
  delay,
}: TooltipProps) {
  if (!tooltip) {
    return children
  }

  return (
    <TooltipPrimitive.Trigger
      handle={tooltipHandle}
      payload={{ content: tooltip, variant, size, textAlign, side, className }}
      delay={delay}
      render={children}
    />
  )
}
