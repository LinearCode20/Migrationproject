"use client"

import { formatDate, formatDateRange } from "@dirstack/utils"
import { format, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { parseAsString, useQueryStates } from "nuqs"
import type { ComponentProps } from "react"
import { Button } from "~/components/common/button"
import { Calendar, useCalendarFocus } from "~/components/common/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/common/popover"
import { cx } from "~/lib/utils"

function parseDate(value: string) {
  return value ? parseISO(value) : undefined
}

interface DateRange {
  from?: Date
  to?: Date
}

function getDateLabel({ from, to }: DateRange) {
  if (!from) {
    return "Pick a date"
  }

  return to ? formatDateRange(from, to) : formatDate(from)
}

/** Date range filter synced to the `from` and `to` query params. */
export function DateRangePicker({ className, ...props }: ComponentProps<typeof PopoverContent>) {
  const [dateParams, setDateParams] = useQueryStates(
    {
      from: parseAsString.withDefault(""),
      to: parseAsString.withDefault(""),
    },
    {
      clearOnDefault: true,
      shallow: false,
    },
  )

  const date = { from: parseDate(dateParams.from), to: parseDate(dateParams.to) }
  const { ref: calendarRef, initialFocus } = useCalendarFocus()

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="secondary"
            size="md"
            prefix={<CalendarIcon />}
            className={cx(
              "shrink-0 justify-start truncate text-left",
              !date.from && "text-muted-foreground",
            )}
          />
        }
      >
        {getDateLabel(date)}
      </PopoverTrigger>

      <PopoverContent
        ref={calendarRef}
        initialFocus={initialFocus}
        className={cx("w-auto", className)}
        {...props}
      >
        <Calendar
          mode="range"
          numberOfMonths={2}
          defaultMonth={date.from}
          selected={date}
          onSelect={range => {
            void setDateParams({
              // Calendar days, not instants: a local midnight sent as an ISO instant falls on
              // the day before anywhere east of UTC once the server reads it.
              from: range?.from ? format(range.from, "yyyy-MM-dd") : "",
              to: range?.to ? format(range.to, "yyyy-MM-dd") : "",
            })
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
