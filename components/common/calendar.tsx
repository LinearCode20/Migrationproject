"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useFormatter } from "next-intl"
import { type ComponentProps, useRef } from "react"
import type { DayButtonProps, Formatters } from "react-day-picker"
import { type Chevron, DayButton, DayPicker } from "react-day-picker"
import { buttonVariants } from "~/components/common/button"
import { cx } from "~/lib/utils"

function CalendarChevron({ orientation }: ComponentProps<typeof Chevron>) {
  if (orientation === "left") {
    return <ChevronLeftIcon />
  }

  return <ChevronRightIcon />
}

/**
 * The day's button. Its look is resolved here from the modifiers rather than through
 * `classNames`: a day inside a selected range carries `selected` and `range_middle` at once,
 * and two class strings on one element have no defined winner.
 */
function CalendarDayButton({ modifiers, className, ...props }: DayButtonProps) {
  // The ends of a range read as picked; the days between are only tinted by their cell.
  const isFilled = modifiers.selected && !modifiers.range_middle

  return (
    <DayButton
      modifiers={modifiers}
      type="button"
      className={cx(
        "relative w-full px-1 py-[10%] cursor-pointer rounded-md disabled:pointer-events-none",
        isFilled ? "bg-foreground text-background" : "hover:bg-muted",
        modifiers.range_middle && "text-foreground hover:bg-transparent",
        modifiers.today && !isFilled && "font-semibold text-primary",
        (modifiers.outside || modifiers.disabled) && "opacity-40",
        className,
      )}
      {...props}
    />
  )
}

/**
 * `ref` and `initialFocus` for the popover or dialog that holds a `Calendar`, so focus lands on
 * the day the arrow keys move from (the selected day, or today) instead of the back arrow.
 */
export function useCalendarFocus() {
  const ref = useRef<HTMLDivElement>(null)

  function initialFocus() {
    return ref.current?.querySelector<HTMLElement>('[role="grid"] button[tabindex="0"]') ?? true
  }

  return { ref, initialFocus }
}

export function Calendar({ classNames, ...props }: ComponentProps<typeof DayPicker>) {
  const format = useFormatter()

  const buttonClasses = buttonVariants({ variant: "ghost" }).base({
    className: "text-lg p-1 pointer-events-auto",
  })

  // Use next-intl formatter for i18n date formatting.
  // Override timeZone to the browser's local timezone because react-day-picker
  // creates dates in local time, while next-intl may default to UTC.
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const formatters: Partial<Formatters> = {
    formatCaption: date => format.dateTime(date, { month: "long", year: "numeric", timeZone }),
    formatWeekdayName: date => format.dateTime(date, { weekday: "short", timeZone }),
    formatMonthDropdown: date => format.dateTime(date, { month: "long", timeZone }),
  }

  return (
    <DayPicker
      weekStartsOn={1}
      formatters={formatters}
      classNames={{
        months: "relative flex flex-col sm:flex-row gap-y-4 sm:gap-x-4 sm:gap-y-0",
        month: "group/month space-y-4 w-full",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "absolute top-px inset-x-0 z-10 flex items-center justify-between gap-x-1 pointer-events-none",
        button_previous: buttonClasses,
        button_next: buttonClasses,
        month_grid: "w-full border-collapse gap-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground/50 rounded-md min-w-8 w-full font-normal text-xs",
        week: "group/week flex mt-2",
        day: "group/day relative w-full text-center text-[0.8125rem] rounded-md focus-within:z-20",
        // The band behind a selected range; `CalendarDayButton` draws the picked ends.
        range_start: "rounded-r-none bg-muted",
        range_middle: "rounded-none bg-muted",
        range_end: "rounded-l-none bg-muted",
        hidden: "invisible",
        ...classNames,
      }}
      components={{ Chevron: CalendarChevron, DayButton: CalendarDayButton }}
      {...props}
    />
  )
}
