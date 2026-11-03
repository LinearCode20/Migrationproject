"use client"

import { formatNumber, sumBy } from "@dirstack/utils"
import { format, parseISO } from "date-fns"
import plur from "plur"
import type { ComponentProps } from "react"
import { Note } from "~/components/common/note"
import { Tooltip } from "~/components/common/tooltip"
import { cx } from "~/lib/utils"

export interface ChartData {
  date: string
  value: number
}

interface ChartProps extends Partial<ComponentProps<"div">> {
  data: ChartData[]
  cellClassName?: string
  dataLabel?: string
  formatValue?: (value: number) => string
}

function formatDay(date: string) {
  return format(parseISO(date), "MMM d")
}

export function Chart({
  className,
  cellClassName,
  data,
  dataLabel,
  formatValue = formatNumber,
  ...props
}: ChartProps) {
  if (data.length === 0) {
    return <Note>No data available.</Note>
  }

  const maxValue = Math.max(...data.map(item => item.value))
  const total = sumBy(data, item => item.value)
  const firstDay = formatDay(data[0].date)
  const lastDay = formatDay(data[data.length - 1].date)
  const summary = `Total ${formatValue(total)} from ${firstDay} to ${lastDay}`

  return (
    <div
      // A div keeps the bar layout, the role exposes the bars as one labelled graphic.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="img"
      aria-label={summary}
      className={cx("flex flex-col gap-2 size-full", className)}
      {...props}
    >
      <div className="flex items-end justify-between gap-[0.75%] flex-1 min-h-24">
        {data.map(item => (
          <Tooltip
            key={item.date}
            side="bottom"
            tooltip={
              <>
                <span className="opacity-60">
                  {format(parseISO(item.date), "EEE, MMM d, yyyy")}
                </span>

                <span className="font-medium">
                  {formatValue(item.value)} {dataLabel && plur(dataLabel, item.value)}
                </span>
              </>
            }
            className="flex-col items-start gap-0.5"
          >
            <div className="flex-1 flex items-end h-full">
              <div
                style={{ height: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : "0%" }}
                className={cx(
                  "flex-1 min-h-0.5 bg-primary rounded-full duration-300 opacity-75 hover:opacity-100",
                  cellClassName,
                  // Zero days keep a faint stub, so an empty day reads as zero and not as missing.
                  item.value === 0 && "opacity-25 hover:opacity-50",
                )}
              />
            </div>
          </Tooltip>
        ))}
      </div>

      <div className="flex justify-between text-xs/4 text-muted-foreground">
        <span>{firstDay}</span>
        <span>{lastDay}</span>
      </div>
    </div>
  )
}
