import { countBy, fromUnix, minorUnits, tryCatch } from "@dirstack/utils"
import { addDays } from "date-fns"
import { calculateMetricStats, getMetricDateRange, toDateKey } from "~/lib/metrics"
import {
  findMetricCounts,
  findPaymentIntentsCreatedBetween,
  findUsersCreatedBetween,
} from "~/server/metrics/queries"
import { authedProcedure } from "~/server/orpc/procedure"
import { getVisitorsByDay } from "~/services/analytics"

const adminMetrics = authedProcedure.meta({
  permission: "metrics.read",
})

export const metrics = {
  stats: adminMetrics.handler(async () => findMetricCounts()),

  revenue: adminMetrics.handler(async () => {
    const range = getMetricDateRange()

    const { data: paymentIntents, error } = await tryCatch(
      findPaymentIntentsCreatedBetween(range.previousStartDate, addDays(range.endDate, 1)),
    )

    if (error) {
      console.error("Revenue error:", error)
      return { results: [], totalRevenue: 0, revenueChange: null }
    }

    const revenueByDate = paymentIntents
      .filter(({ status }) => status === "succeeded")
      .reduce<Record<string, number>>((revenue, paymentIntent) => {
        const date = toDateKey(fromUnix(paymentIntent.created))
        const amount = Math.round(
          paymentIntent.amount_received / minorUnits(paymentIntent.currency),
        )
        revenue[date] = (revenue[date] ?? 0) + amount
        return revenue
      }, {})

    const { results, total, change } = calculateMetricStats(revenueByDate, range)

    return { results, totalRevenue: total, revenueChange: change }
  }),

  visitors: adminMetrics.handler(async () => {
    const range = getMetricDateRange()
    const visitorData = await getVisitorsByDay(
      toDateKey(range.previousStartDate),
      toDateKey(range.endDate),
    )

    const { results, total, change } = calculateMetricStats(visitorData, range)

    return { results, totalVisitors: total, visitorsChange: change }
  }),

  userMetric: adminMetrics.handler(async () => {
    const range = getMetricDateRange()
    const newUsers = await findUsersCreatedBetween(
      range.previousStartDate,
      addDays(range.endDate, 1),
    )
    const usersByDate = countBy(newUsers, ({ createdAt }) => toDateKey(createdAt))

    const { results, total, change } = calculateMetricStats(usersByDate, range)

    return { results, totalUsers: total, usersChange: change }
  }),
}
