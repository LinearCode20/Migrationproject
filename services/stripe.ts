import Stripe from "stripe"
import { env } from "~/env"

/**
 * Stripe is on only when both its secret key and webhook secret are set. Without it,
 * the listing catalog is empty and every payment action reports that payments are off.
 */
export const isStripeEnabled = !!env.STRIPE_SECRET_KEY && !!env.STRIPE_WEBHOOK_SECRET

let stripe: Stripe | undefined

/**
 * The Stripe client, created on first use, because the SDK throws on a missing key at
 * construction.
 * @throws When Stripe is not configured.
 */
export function getStripeClient() {
  if (!isStripeEnabled || !env.STRIPE_SECRET_KEY) {
    throw new Error("Payments are not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.")
  }

  stripe ??= new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-09-30.endive",
  })

  return stripe
}
