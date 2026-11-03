import { HOUR_SECONDS } from "@dirstack/utils"
import { ORPCError } from "@orpc/server"
import { getTranslations } from "next-intl/server"
import { siteConfig } from "~/config/site"
import { canOwnTool, isToolTier, isToolTierUpgrade } from "~/lib/tools"
import { ensureFound } from "~/server/orpc/helpers"
import { authedProcedure } from "~/server/orpc/procedure"
import { findListingCustomer, findPortalConfiguration } from "~/server/products/billing"
import { toListingMetadata } from "~/server/products/listing"
import { findListingPrice } from "~/server/products/queries"
import { billingPortalSchema, checkoutSchema } from "~/server/products/schema"
import { findManagedTool, findToolById } from "~/server/tools/queries"
import { getStripeClient, isStripeEnabled } from "~/services/stripe"

/**
 * Refuse a payment action while Stripe is off, with a message the caller can show.
 */
function ensurePaymentsEnabled() {
  if (!isStripeEnabled) {
    throw new ORPCError("PRECONDITION_FAILED", { message: "Payments are not configured." })
  }
}

export const products = {
  /**
   * A Stripe Checkout session for a listing upgrade. The payer becomes the tool's owner once
   * the payment completes, so checkout needs a signed-in user.
   */
  createCheckout: authedProcedure
    .meta({
      permission: "products.checkout",
      rateLimit: { points: 20, duration: HOUR_SECONDS },
    })
    .input(checkoutSchema)
    .handler(async ({ input, context: { user } }) => {
      ensurePaymentsEnabled()

      const { toolId, priceId, discountCode, attributionId } = input
      const tool = ensureFound(await findToolById(toolId), "Tool")
      const listing = await findListingPrice(priceId, discountCode)
      const tier = listing?.product.metadata.tier

      // Only a listing price above the tool's current tier can be bought. This also keeps a
      // second subscription from stacking on a tool that already has the tier. A tool with
      // another owner keeps it, so only someone who would own the tool may pay for it.
      if (
        !listing ||
        !isToolTier(tier) ||
        !isToolTierUpgrade(tool, tier) ||
        !canOwnTool(tool, user)
      ) {
        throw new ORPCError("BAD_REQUEST", { message: "This listing can't be purchased." })
      }

      const { price, promotionCodeId } = listing
      const mode = price.type === "recurring" ? "subscription" : "payment"
      // Highseat reads `attribution_id` from the session, the invoice or the subscription, and
      // credits the sale to the visit that started it.
      const metadata = {
        ...toListingMetadata(tool, tier),
        ...(attributionId ? { attribution_id: attributionId } : {}),
      }
      const url = `${siteConfig.url}/submit/${tool.slug}`

      const checkout = await getStripeClient().checkout.sessions.create({
        mode,
        metadata,
        line_items: [{ price: price.id, quantity: 1 }],
        automatic_tax: { enabled: true },
        tax_id_collection: { enabled: true },
        customer_creation: mode === "payment" ? "if_required" : undefined,
        invoice_creation:
          mode === "payment" ? { enabled: true, invoice_data: { metadata } } : undefined,
        subscription_data: mode === "subscription" ? { metadata } : undefined,
        // A promotion code keeps its own limits (expiry, redemptions, first-time customers),
        // which applying its coupon directly would skip.
        allow_promotion_codes: promotionCodeId ? undefined : true,
        discounts: promotionCodeId ? [{ promotion_code: promotionCodeId }] : undefined,
        success_url: `${url}/success?sessionId={CHECKOUT_SESSION_ID}`,
        cancel_url: `${url}?cancelled=true`,
        customer_email: user.email,
        client_reference_id: user.id,
      })

      if (!checkout.url) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Unable to create a new Stripe Checkout Session.",
        })
      }

      return { url: checkout.url }
    }),

  /**
   * A Stripe customer portal session for a tool's listing subscription, where the payer
   * updates their card, downloads invoices or cancels. Session-scoped, with no
   * `meta.permission`: `findManagedTool` filters on the owner, so anyone else's tool is
   * `NOT_FOUND`. The portal also opens only for the payer, because it shows their whole
   * Stripe account.
   */
  createBillingPortal: authedProcedure
    .meta({ rateLimit: { points: 20, duration: HOUR_SECONDS } })
    .input(billingPortalSchema)
    .handler(async ({ input: { toolId }, context: { user } }) => {
      ensurePaymentsEnabled()

      const tool = ensureFound(await findManagedTool(toolId, user.id), "Tool")
      const t = await getTranslations("tools.billing.errors")

      // The email decides who the payer is, so an unverified one can't open the portal.
      const [customer, configuration] = await Promise.all([
        user.emailVerified ? findListingCustomer(tool, user.email) : undefined,
        findPortalConfiguration(),
      ])

      if (!customer) {
        throw new ORPCError("NOT_FOUND", { message: t("no_subscription", { email: user.email }) })
      }

      if (!configuration) {
        console.error("Stripe has no customer portal configuration. Run the setup script.")
        throw new ORPCError("PRECONDITION_FAILED", {
          message: t("not_configured", { email: siteConfig.email }),
        })
      }

      const portal = await getStripeClient().billingPortal.sessions.create({
        customer,
        configuration: configuration.id,
        return_url: `${siteConfig.url}/${tool.slug}`,
      })

      return { url: portal.url }
    }),
}
