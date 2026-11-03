import { toUnix } from "@dirstack/utils"
import { db } from "~/services/db"
import { getStripeClient, isStripeEnabled } from "~/services/stripe"

export async function findMetricCounts() {
  const [toolCount, categoryCount, userCount] = await Promise.all([
    db.tool.count(),
    db.category.count(),
    db.user.count(),
  ])

  return { toolCount, categoryCount, userCount }
}

export async function findUsersCreatedBetween(startDate: Date, endDate: Date) {
  return db.user.findMany({
    where: { createdAt: { gte: startDate, lt: endDate } },
    select: { createdAt: true },
  })
}

/**
 * Every Stripe payment intent created in `[startDate, endDate)`, across all
 * pages, capped at 10,000. Without Stripe there are none.
 */
export async function findPaymentIntentsCreatedBetween(startDate: Date, endDate: Date) {
  if (!isStripeEnabled) {
    return []
  }

  return getStripeClient()
    .paymentIntents.list({
      created: {
        gte: toUnix(startDate),
        lt: toUnix(endDate),
      },
      limit: 100,
    })
    .autoPagingToArray({ limit: 10_000 })
}
