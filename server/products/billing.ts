import "server-only"
import type Stripe from "stripe"
import type { Tool } from "~/.generated/prisma/client"
import { getStripeClient } from "~/services/stripe"

/**
 * Subscription statuses that still bill the customer.
 */
const billingStatuses: Stripe.Subscription.Status[] = ["active", "trialing", "past_due", "unpaid"]

/**
 * Check if a subscription pays for a tool's listing. Subscriptions carry the tool's id in their
 * metadata, and older ones carry only its slug.
 */
function isListingSubscription({ metadata }: Stripe.Subscription, tool: Pick<Tool, "id" | "slug">) {
  return metadata.toolId ? metadata.toolId === tool.id : metadata.tool === tool.slug
}

/**
 * The Stripe customer with the given email who pays for a tool's live listing subscription.
 * The portal opens the payer's whole Stripe account (card, invoices, billing address), so only
 * the payer's email finds it. List calls, unlike search, see a subscription as soon as the
 * checkout creates it.
 */
export async function findListingCustomer(tool: Pick<Tool, "id" | "slug">, email: string) {
  const stripe = getStripeClient()
  const { data: customers } = await stripe.customers.list({ email, limit: 10 })

  for (const customer of customers) {
    const { data } = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 100,
    })

    const isPayer = data.some(
      subscription =>
        billingStatuses.includes(subscription.status) && isListingSubscription(subscription, tool),
    )

    if (isPayer) {
      return customer.id
    }
  }
}

/**
 * The customer portal configuration to open sessions with: the default one, or else any
 * active one, such as the one `scripts/setup-stripe-products.ts` creates. Live mode
 * rejects portal sessions on an account without a saved configuration.
 */
export async function findPortalConfiguration() {
  const { data } = await getStripeClient().billingPortal.configurations.list({
    active: true,
    limit: 100,
  })

  return data.find(({ is_default }) => is_default) ?? data.at(0)
}
