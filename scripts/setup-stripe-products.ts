import type { Stripe } from "stripe"
import { siteConfig } from "~/config/site"
import { tiersConfig } from "~/config/tiers"
import { getStripeClient } from "~/services/stripe"

const stripe = getStripeClient()

interface ProductInput extends Stripe.ProductCreateParams {
  price_data?: Stripe.PriceCreateParams[]
}

const products: ProductInput[] = [
  {
    name: "Free Listing",
    description: "Free listing with a wait time and a direct link to your website.",
    active: true,
    metadata: { tier: "Free" },
    marketing_features: [
      { name: "✗ No content updates" },
      { name: "✗ No featured spot" },
      { name: "✗ No prominent placement" },
    ],
    default_price_data: {
      unit_amount: 0,
      currency: siteConfig.currency,
    },
  },
  {
    name: "Standard Listing",
    description: "Upgrade your listing to skip the queue and get published within 24 hours.",
    active: true,
    metadata: { tier: "Standard" },
    marketing_features: [
      { name: "✓ Unlimited content updates" },
      { name: "✗ No featured spot" },
      { name: "✗ No prominent placement" },
    ],
    default_price_data: {
      unit_amount: 9700,
      currency: siteConfig.currency,
    },
  },
  {
    name: "Premium Listing",
    description: "Premium listing with a homepage spot and a prominent placement.",
    active: true,
    metadata: { tier: "Premium" },
    marketing_features: [
      { name: "✓ Unlimited content updates" },
      { name: "✓ Featured spot on homepage" },
      { name: "✓ Prominent placement" },
    ],
    default_price_data: {
      unit_amount: 19700,
      currency: siteConfig.currency,
      recurring: {
        interval: "month",
        interval_count: 1,
      },
    },
    price_data: [
      {
        unit_amount: 197000,
        currency: siteConfig.currency,
        recurring: {
          interval: "year",
          interval_count: 1,
        },
      },
    ],
  },
]

/**
 * The customer portal where subscribers update their card, download invoices or cancel.
 * A cancellation ends the subscription at the period end, and the webhook then returns the
 * tool to its previous tier.
 */
const portalConfiguration: Stripe.BillingPortal.ConfigurationCreateParams = {
  name: `${siteConfig.name} listings`,
  default_return_url: siteConfig.url,
  features: {
    customer_update: { enabled: true, allowed_updates: ["email", "address", "tax_id"] },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: { enabled: true, mode: "at_period_end" },
  },
}

/**
 * Create the portal configuration unless the account already has an active one.
 */
async function setupPortalConfiguration() {
  const { data } = await stripe.billingPortal.configurations.list({ active: true, limit: 1 })

  if (data.length) {
    console.log("Skipping the customer portal, the account already has a configuration.")
    return
  }

  await stripe.billingPortal.configurations.create(portalConfiguration)
}

async function main() {
  try {
    // Validate that all product tiers exist in tiersConfig.
    for (const product of products) {
      const tier = product.metadata?.tier
      if (tier && !(tier in tiersConfig)) {
        throw new Error(
          `Product "${product.name}" has unknown tier "${tier}". Add it to config/tiers.ts.`,
        )
      }
    }

    for (const { price_data, ...productData } of products) {
      const product = await stripe.products.create(productData)

      if (price_data) {
        for (const priceData of price_data) {
          await stripe.prices.create({ ...priceData, product: product.id })
        }
      }
    }

    await setupPortalConfiguration()

    console.log("🎉 All products and prices replicated successfully!")
  } catch (error) {
    console.error("❌ Error replicating products:", error)
    process.exit(1)
  }
}

main().catch(console.error)
