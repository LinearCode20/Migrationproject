"use client"

import { chunk } from "@dirstack/utils"
import { useQuery } from "@tanstack/react-query"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parse,
  startOfWeek,
  subMonths,
} from "date-fns"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import Link from "next/link"
import { useQueryState } from "nuqs"
import { type ComponentProps, useState } from "react"
import { ToolStatus } from "~/.generated/prisma/browser"
import { MetricHeader } from "~/components/app/metrics/metric-header"
import { Button } from "~/components/common/button"
import { ButtonGroup } from "~/components/common/button-group"
import { Card } from "~/components/common/card"
import { ShowMore } from "~/components/common/show-more"
import { Stack } from "~/components/common/stack"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findScheduledTools } from "~/server/tools/queries"

type Tools = Awaited<ReturnType<typeof findScheduledTools>>

interface CalendarDayProps extends ComponentProps<"td"> {
  day: Date
  month: Date
  tools: Tools
  isToday: boolean
}

function CalendarDay({ className, day, tools, month, isToday, ...props }: CalendarDayProps) {
  const isCurrentMonth = isSameMonth(day, month)

  return (
    <td
      className={cx(
        "h-24 p-2 border align-top lg:px-3",
        !isCurrentMonth && "bg-foreground/4 text-muted-foreground/50",
        className,
      )}
      {...props}
    >
      <Stack size="xs" direction="column">
        <time
          dateTime={format(day, "yyyy-MM-dd")}
          className={cx("text-xs text-muted-foreground", isToday && "font-semibold text-primary")}
        >
          {format(day, "d")}
        </time>

        <ShowMore size="xs" direction="column" limit={5} className="w-full">
          {tools.map(({ id, name, status }) => (
            <Link
              key={id}
              href={`/app/tools/${id}`}
              title={name}
              className={cx(
                "max-w-full font-medium truncate hover:text-primary",
                status === ToolStatus.Published && "text-muted-foreground/50 line-through",
              )}
            >
              {name}
            </Link>
          ))}
        </ShowMore>
      </Stack>
    </td>
  )
}

export function ScheduleCalendar({ className, ...props }: ComponentProps<"div">) {
  const [today] = useState(() => new Date())
  const defaultFormat = "yyyy-MM"
  const defaultValue = format(today, defaultFormat)
  const [month, setMonth] = useQueryState("month", { defaultValue })

  const currentMonth = parse(month, defaultFormat, today)
  const calendarStart = startOfWeek(currentMonth, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })

  const { data: tools = [] } = useQuery(
    orpc.tools.scheduled.queryOptions({
      input: {
        start: calendarStart,
        end: calendarEnd,
      },
    }),
  )

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weeks = chunk(days, 7)

  const isCurrentMonth = isSameMonth(currentMonth, today)

  return (
    <Card className={cx("gap-2", className)} {...props}>
      <MetricHeader
        title="Calendar"
        value={format(currentMonth, "MMM yyyy")}
        note={
          <ButtonGroup className="-my-1.5">
            {!isCurrentMonth && (
              <Button
                variant="secondary"
                size="md"
                prefix={<CalendarIcon />}
                onClick={() => setMonth(null)}
              >
                Now
              </Button>
            )}

            <Button
              variant="secondary"
              size="md"
              prefix={<ChevronLeftIcon />}
              onClick={() => setMonth(format(subMonths(currentMonth, 1), defaultFormat))}
            >
              <span className="max-sm:sr-only">Previous</span>
            </Button>

            <Button
              variant="secondary"
              size="md"
              suffix={<ChevronRightIcon />}
              onClick={() => setMonth(format(addMonths(currentMonth, 1), defaultFormat))}
            >
              <span className="max-sm:sr-only">Next</span>
            </Button>
          </ButtonGroup>
        }
      />

      <div className="w-[calc(100%+2.5rem)] -mx-5 px-5 overflow-x-auto mask-r-from-[calc(100%-1.5rem)] mask-l-from-[calc(100%-1.5rem)]">
        <table className="min-w-3xl w-full table-fixed border-collapse text-sm">
          <thead>
            <tr>
              {weeks[0]?.map((day, index) => (
                <th
                  key={day.getDay()}
                  style={{ width: index < 5 ? "16%" : "10%" }}
                  className="text-start text-muted-foreground p-2 text-xs font-normal"
                >
                  {format(day, "EEE")}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {weeks.map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map(day => (
                  <CalendarDay
                    key={day.toISOString()}
                    day={day}
                    month={currentMonth}
                    isToday={isSameDay(day, today)}
                    tools={tools.filter(
                      tool => tool.publishedAt && isSameDay(tool.publishedAt, day),
                    )}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
