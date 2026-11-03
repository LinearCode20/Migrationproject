import { formatCurrency, minorUnits, tryCatch } from "@dirstack/utils"
import { getLocale, getTranslations } from "next-intl/server"
import { connection } from "next/server"
import type { ComponentProps } from "react"
import { Note } from "~/components/common/note"
import { getQueueMonths, isQueueLong } from "~/lib/products"
import { findLowestListingPrice } from "~/server/products/queries"
import { countSubmittedTools } from "~/server/tools/queries"

/**
 * The free queue wait and the cheapest paid listing, shown before anyone submits. Both are
 * site-wide, so the line is safe on the cached page. A failed Stripe load drops the price
 * and keeps the page.
 */
export async function SubmitNote(props: ComponentProps<typeof Note>) {
  // The queue is live data and the wait counts from today, so the line renders per request.
  await connection()

  const [t, locale, queue, { data: price, error }] = await Promise.all([
    getTranslations("forms.submit.pricing"),
    getLocale(),
    countSubmittedTools(),
    tryCatch(findLowestListingPrice()),
  ])

  if (error) {
    console.error("Failed to load the lowest listing price:", error)
  }

  const months = isQueueLong(queue) ? getQueueMonths(queue) : undefined

  const amount = price
    ? t("price", {
        price: formatCurrency((price.unit_amount ?? 0) / minorUnits(price.currency), {
          currency: price.currency.toUpperCase(),
          locale,
        }),
        interval: price.recurring?.interval ?? "none",
      })
    : undefined

  if (months && amount) {
    return <Note {...props}>{t("queue_and_paid", { months, price: amount })}</Note>
  }

  if (months) {
    return <Note {...props}>{t("queue", { months })}</Note>
  }

  if (amount) {
    return <Note {...props}>{t("paid", { price: amount })}</Note>
  }
}
