import { sumBy } from "@dirstack/utils"
import { eachDayOfInterval, format, startOfDay, subDays } from "date-fns"
import type { ChartData } from "~/components/app/chart"

/**
 * Get the date range for metrics (last 30 days, excluding today), plus the 30 days before it
 * for comparison. All dates are start-of-day, and the end dates are inclusive.
 */
export function getMetricDateRange() {
  const endDate = subDays(startOfDay(new Date()), 1)
  const startDate = subDays(endDate, 29)
  const previousEndDate = subDays(startDate, 1)
  const previousStartDate = subDays(previousEndDate, 29)

  return { startDate, endDate, previousStartDate, previousEndDate }
}

/**
 * Day key used to bucket metric values, e.g. `2026-01-31`.
 */
export function toDateKey(date: Date | number) {
  return format(date, "yyyy-MM-dd")
}

/**
 * Fill in missing dates with zero values
 * @param dataByDate - Record of date strings to values
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @returns Array of ChartData with all dates filled in
 */
function fillMissingDates(
  dataByDate: Record<string, number>,
  startDate: Date,
  endDate: Date,
): ChartData[] {
  return eachDayOfInterval({ start: startOfDay(startDate), end: endDate }).map(day => {
    const date = toDateKey(day)
    return { date, value: dataByDate[date] ?? 0 }
  })
}

/**
 * The change from `previous` to `current` as a fraction, where 0.06 reads as "+6%". A previous
 * period of zero has nothing to divide by, so a metric that grew from nothing counts as +100%
 * and one that stayed at nothing as no change at all, the same reading Plausible gives them.
 */
function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 1 : 0
  }

  return (current - previous) / previous
}

/**
 * Build the daily series for the current period, its total, and the change against the
 * previous period
 * @param dataByDate - Record of date strings to values, covering both periods
 * @param range - The periods from `getMetricDateRange`
 * @returns The daily series, the total, and the change as a fraction (`0.12` is +12%)
 */
export function calculateMetricStats(
  dataByDate: Record<string, number>,
  range: ReturnType<typeof getMetricDateRange>,
) {
  const results = fillMissingDates(dataByDate, range.startDate, range.endDate)
  const previous = fillMissingDates(dataByDate, range.previousStartDate, range.previousEndDate)
  const total = sumBy(results, day => day.value)
  const change = percentChange(
    total,
    sumBy(previous, day => day.value),
  )

  return { results, total, change }
}
