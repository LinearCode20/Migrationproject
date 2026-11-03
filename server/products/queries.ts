import "server-only"
import { serialize, tryCatch } from "@dirstack/utils"
import { cacheLife, cacheTag } from "next/cache"
import type Stripe from "stripe"
import type { Tool, ToolTier } from "~/.generated/prisma/client"
import type { ProductWithPrices } from "~/lib/products"
import { isToolTier } from "~/lib/tools"
import { parseListingMetadata } from "~/server/products/listing"
import { getStripeClient, isStripeEnabled } from "~/services/stripe"

async function findStripeProducts() {
  "use cache"

  cacheTag("stripe-products")
  cacheLife("hours")

  // Without Stripe the catalog is empty, so nothing is for sale.
  if (!isStripeEnabled) {
    return []
  }

  const { data, error } = await tryCatch(
    getStripeClient().products.list({
      active: true,
      limit: 100,
      expand: ["data.default_price"],
    }),
  )

  if (error) {
    console.error("Failed to fetch Stripe products:", error)
    throw new Error("Unable to load products. Please try again later.")
  }

  return serialize(data.data)
}

async function findStripePricesByProduct(productId: string) {
  "use cache"

  cacheTag(`stripe-prices-${productId}`)
  cacheTag("stripe-prices")
  cacheLife("days")

  const { data, error } = await tryCatch(
    getStripeClient().prices.list({
      product: productId,
      active: true,
      limit: 100,
    }),
  )

  if (error) {
    console.error(`Failed to fetch prices for product ${productId}:`, error)
    throw new Error("Unable to load pricing information. Please try again later.")
  }

  return serialize(data.data)
}

async function findStripePromotionCodeByCode(code: string) {
  "use cache"

  cacheTag(`stripe-coupon-${code}`)
  cacheTag("stripe-coupon")
  cacheLife("days")

  const { data, error } = await tryCatch(
    getStripeClient().promotionCodes.list({
      code,
      limit: 1,
      active: true,
      expand: ["data.promotion.coupon.applies_to"],
    }),
  )

  if (error) {
    console.error(`Failed to fetch promotion code ${code}:`, error)
    return
  }

  const promotionCode = data.data[0]
  return promotionCode ? serialize(promotionCode) : undefined
}

/**
 * The code is user-supplied and becomes both a cache key and a Stripe API call,
 * so normalize and bound it before it reaches either. Stripe promotion codes
 * are case-insensitive.
 */
async function findStripePromotionCode(code?: string) {
  const normalized = code
    ?.trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 32)

  if (!normalized || !isStripeEnabled) {
    return
  }

  return findStripePromotionCodeByCode(normalized)
}

/**
 * The coupon behind a promotion code, if it can still be redeemed.
 */
function getPromotionCoupon(promotionCode?: Stripe.PromotionCode) {
  const coupon = promotionCode?.promotion?.coupon
  return typeof coupon === "object" && coupon?.valid ? coupon : undefined
}

/**
 * Get the price amount from a Stripe price object or string.
 */
function extractPriceAmount(price?: Stripe.Price | string | null) {
  return typeof price === "object" && price !== null ? (price.unit_amount ?? 0) : 0
}

/**
 * Sort products by their default price, cheapest first.
 */
function sortProductsByPrice(products: Stripe.Product[]) {
  return products.sort(
    (first, second) =>
      extractPriceAmount(first.default_price) - extractPriceAmount(second.default_price),
  )
}

/**
 * Check if a product is eligible for a discount with the given coupon.
 */
function isProductEligibleForDiscount(productId: string, coupon?: Stripe.Coupon) {
  return !coupon?.applies_to || coupon.applies_to.products.includes(productId)
}

/**
 * Fetch prices for a list of products and prepare them for display.
 */
async function getProductsWithPrices(
  products: Stripe.Product[],
  coupon?: Stripe.Coupon,
): Promise<ProductWithPrices[]> {
  return Promise.all(
    products.map(async product => {
      const prices = await findStripePricesByProduct(product.id)
      const isEligibleForDiscount = isProductEligibleForDiscount(product.id, coupon)

      return {
        product,
        prices,
        coupon: isEligibleForDiscount ? coupon : undefined,
      }
    }),
  )
}

/**
 * Products for a pricing listing, sorted by price, with their prices and the
 * coupon resolved from the discount code where the product is eligible.
 */
export async function getProductsForListing(discountCode?: string) {
  const [products, promotionCode] = await Promise.all([
    findStripeProducts(),
    findStripePromotionCode(discountCode),
  ])

  return getProductsWithPrices(sortProductsByPrice(products), getPromotionCoupon(promotionCode))
}

/**
 * The cheapest paid price among the listing tiers, for the price hint on the submit page.
 * Returns `undefined` when no listing tier has a paid price.
 */
export async function findLowestListingPrice() {
  const listings = await getProductsForListing()

  return listings
    .filter(({ product }) => isToolTier(product.metadata.tier))
    .flatMap(({ prices }) => prices)
    .filter(({ unit_amount }) => !!unit_amount)
    .reduce<Stripe.Price | undefined>(
      (lowest, price) =>
        (price.unit_amount ?? 0) < (lowest?.unit_amount ?? Number.POSITIVE_INFINITY)
          ? price
          : lowest,
      undefined,
    )
}

/**
 * A price from the listing catalog, with its product and the promotion code to apply
 * when the discount code covers that product. Returns `undefined` for any price
 * outside the catalog.
 */
export async function findListingPrice(priceId: string, discountCode?: string) {
  const [products, promotionCode] = await Promise.all([
    findStripeProducts(),
    findStripePromotionCode(discountCode),
  ])

  const listings = await getProductsWithPrices(products, getPromotionCoupon(promotionCode))

  for (const { product, prices, coupon } of listings) {
    const price = prices.find(({ id }) => id === priceId)

    if (price) {
      return { product, price, promotionCodeId: coupon ? promotionCode?.id : undefined }
    }
  }
}

/**
 * Check if a tier is sold as a subscription, so a tool on it has billing to manage.
 */
export async function isSubscriptionTier(tier: ToolTier) {
  const products = await findStripeProducts()
  const listings = await getProductsWithPrices(
    products.filter(({ metadata }) => metadata.tier === tier),
  )

  return listings.some(({ prices }) => prices.some(({ type }) => type === "recurring"))
}

/**
 * A completed listing checkout for a tool, read for its success page. The session id comes
 * from the URL, so a session that belongs to another tool returns `undefined`.
 */
export async function findListingCheckout(sessionId: string, tool: Pick<Tool, "id">) {
  if (!isStripeEnabled || !sessionId.startsWith("cs_")) {
    return
  }

  const { data: session } = await tryCatch(getStripeClient().checkout.sessions.retrieve(sessionId))
  const listing = parseListingMetadata(session?.metadata)

  if (session?.status !== "complete" || session.metadata?.toolId !== tool.id || !listing?.tier) {
    return
  }

  // A delayed payment method (SEPA, bank transfer) completes the checkout before the money
  // arrives.
  return { tier: listing.tier, isPaid: session.payment_status !== "unpaid" }
}
