import { addDays, differenceInMonths } from "date-fns"
import plur from "plur"
import type { ReactNode } from "react"
import type Stripe from "stripe"
import { submissionsConfig } from "~/config/submissions"

const SYMBOLS = {
  positive: "✓ ",
  neutral: "• ",
  negative: "✗ ",
} as const

type SymbolType = keyof typeof SYMBOLS

export type ProductInterval = "week" | "month" | "year"

export interface ProductFeature {
  name: ReactNode
  footnote?: ReactNode
  type?: keyof typeof SYMBOLS
}

export interface ProductWithPrices {
  product: Stripe.Product
  prices: Stripe.Price[]
  coupon: Stripe.Coupon | undefined
}

export type ProductProps = {
  product?: Partial<Stripe.Product>
  features?: ProductFeature[]
  isDisabled?: boolean
  buttonLabel?: ReactNode
} | null

/**
 * The expected wait for a free listing in whole months, at least one.
 *
 * @param queueSize - The number of submissions waiting to be published.
 * @returns The wait in months.
 */
export function getQueueMonths(queueSize: number) {
  const queueDays = Math.ceil((queueSize / submissionsConfig.postingRate) * 7)

  return Math.max(differenceInMonths(addDays(new Date(), queueDays), new Date()), 1)
}

/**
 * Check if the free queue is long enough to tell a submitter about the wait.
 *
 * @param queueSize - The number of submissions waiting to be published.
 * @returns Whether the wait is worth mentioning.
 */
export function isQueueLong(queueSize: number) {
  return queueSize > submissionsConfig.queueNoticeThreshold
}

export function calculateQueueDuration(queueSize: number) {
  const queueMonths = getQueueMonths(queueSize)

  return `${queueMonths} ${plur("month", queueMonths)}`
}

function extractFeatureTypeFromName(featureName?: string) {
  return Object.keys(SYMBOLS).find(key => featureName?.startsWith(SYMBOLS[key as SymbolType])) as
    | SymbolType
    | undefined
}

function removeTypeSymbolFromName(name: string, type?: SymbolType) {
  return type ? name.replace(SYMBOLS[type], "") : name
}

/**
 * Get the normalized features of a product.
 *
 * @param product - The product to get the features of.
 * @returns The normalized features of the product.
 */
export function getProductFeatures(product: Stripe.Product) {
  return product.marketing_features.map(feature => {
    const type = extractFeatureTypeFromName(feature.name)
    const name = removeTypeSymbolFromName(feature.name ?? "", type)

    return { name, type } satisfies ProductFeature
  })
}
