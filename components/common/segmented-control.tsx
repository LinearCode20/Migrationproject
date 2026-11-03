"use client"

import { Radio } from "@base-ui/react/radio"
import { RadioGroup } from "@base-ui/react/radio-group"
import { type CSSProperties, useLayoutEffect, useRef, useState } from "react"
import { cva, cx, type VariantProps } from "~/lib/utils"

const segmentedControlVariants = cva({
  slots: {
    root: "relative flex rounded-md p-0.5 text-xs",
    indicator:
      "absolute top-0 left-0 h-(--indicator-height) w-(--indicator-width) translate-x-(--indicator-left) translate-y-(--indicator-top) rounded-sm transition-[translate,width] duration-150 ease-out",
    item: "relative z-10 flex items-center justify-center whitespace-nowrap rounded-sm px-2.5 py-1 font-medium cursor-pointer transition text-secondary-foreground hover:text-foreground data-checked:text-foreground",
  },

  variants: {
    variant: {
      muted: {
        root: "bg-foreground/10 [&:not([data-measured])_[data-checked]]:bg-background",
        indicator: "bg-background",
      },
      outline: {
        root: "border border-border bg-background [&:not([data-measured])_[data-checked]]:bg-muted",
        indicator: "bg-muted",
      },
    },
  },

  defaultVariants: {
    variant: "muted",
  },
})

interface SegmentedControlProps<TValue extends string>
  extends
    Omit<RadioGroup.Props, "value" | "defaultValue" | "onValueChange">,
    VariantProps<typeof segmentedControlVariants> {
  value: TValue
  onValueChange: (value: TValue) => void
}

interface IndicatorBox {
  left: number
  top: number
  width: number
  height: number
}

/**
 * One choice out of a few, drawn as a track with a highlight that glides to the chosen option.
 * A radio group underneath, so it is announced as a choice (not as tabs with nothing to show)
 * and the arrow keys move the selection. The highlight is measured from the chosen option;
 * until the first measurement the option paints its own fill, so the server render already
 * shows the selection.
 */
export function SegmentedControl<TValue extends string>({
  value,
  onValueChange,
  variant,
  className,
  children,
  ...props
}: SegmentedControlProps<TValue>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<IndicatorBox>()
  const { root, indicator } = segmentedControlVariants({ variant })

  useLayoutEffect(() => {
    const element = rootRef.current

    if (!element) {
      return
    }

    function measure() {
      const checked = element?.querySelector<HTMLElement>("[data-checked]")

      if (checked) {
        const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = checked
        setBox({ left: offsetLeft, top: offsetTop, width: offsetWidth, height: offsetHeight })
      }
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)

    return () => observer.disconnect()
  }, [value])

  const style = box && {
    "--indicator-left": `${box.left}px`,
    "--indicator-top": `${box.top}px`,
    "--indicator-width": `${box.width}px`,
    "--indicator-height": `${box.height}px`,
  }

  return (
    <RadioGroup
      ref={rootRef}
      value={value}
      data-measured={box ? "" : undefined}
      style={style as CSSProperties}
      className={cx(root(), className)}
      onValueChange={next => onValueChange(next as TValue)}
      {...props}
    >
      {box && <span aria-hidden className={indicator()} />}
      {children}
    </RadioGroup>
  )
}

export function SegmentedControlItem({ className, ...props }: Radio.Root.Props) {
  const { item } = segmentedControlVariants()

  return <Radio.Root className={cx(item(), className)} {...props} />
}
