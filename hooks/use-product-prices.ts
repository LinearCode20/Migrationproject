import { minorUnits } from "@dirstack/utils"
import type Stripe from "stripe"
import { useProductInterval } from "~/contexts/product-interval-context"
import type { ProductInterval } from "~/lib/products"

function findPriceForInterval(prices: Stripe.Price[], interval?: ProductInterval) {
  if (!interval) {
    return prices[0]
  }

  return prices.find(price => price.recurring?.interval === interval)
}

function toMajorUnits(price?: Pick<Stripe.Price, "unit_amount" | "currency">) {
  return price ? (price.unit_amount ?? 0) / minorUnits(price.currency) : 0
}

function calculateCouponDiscount(initialPrice: number, coupon?: Stripe.Coupon | null) {
  if (!coupon) {
    return 0
  }
  if (coupon.percent_off) {
    return (initialPrice * coupon.percent_off) / 100
  }
  if (coupon.amount_off) {
    return coupon.amount_off / minorUnits(coupon.currency ?? "usd")
  }
  return 0
}

function calculateDiscountPercentage(basePrice: number, discountedPrice: number) {
  return basePrice > 0 ? Math.floor(((basePrice - discountedPrice) / basePrice) * 100) : 0
}

export function useProductPrices(prices: Stripe.Price[], coupon: Stripe.Coupon | undefined) {
  const { interval } = useProductInterval()
  const isSubscription = prices.some(price => price.type === "recurring")
  const currentPrice = findPriceForInterval(prices, isSubscription ? interval : undefined)
  const currentPriceValue = toMajorUnits(currentPrice)

  const couponDiscountAmount = calculateCouponDiscount(currentPriceValue, coupon)
  const finalPrice = Math.floor(Math.max(0, currentPriceValue - couponDiscountAmount))

  // For yearly plans, show savings compared to paying monthly.
  let fullPrice: number | null = null
  let discount = 0

  if (isSubscription && interval === "year") {
    const monthlyPrice = findPriceForInterval(prices, "month")
    const monthlyPriceValue = toMajorUnits(monthlyPrice)
    const equivalentYearly = monthlyPriceValue * 12

    if (equivalentYearly > finalPrice) {
      fullPrice = equivalentYearly
      discount = calculateDiscountPercentage(equivalentYearly, finalPrice)
    }
  } else if (couponDiscountAmount > 0) {
    fullPrice = currentPriceValue
    discount = coupon?.percent_off ?? calculateDiscountPercentage(currentPriceValue, finalPrice)
  }

  return {
    isSubscription,
    currentPrice,
    price: finalPrice,
    fullPrice,
    discount,
    currency: (currentPrice?.currency ?? "usd").toUpperCase(),
    interval,
  }
}
