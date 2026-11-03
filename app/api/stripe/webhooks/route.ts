import { getErrorMessage } from "@dirstack/utils"
import { revalidateTag } from "next/cache"
import { after } from "next/server"
import type Stripe from "stripe"
import type { Tool } from "~/.generated/prisma/client"
import { env } from "~/env"
import { canOwnTool, isToolTierUpgrade, isUserOnDomain } from "~/lib/tools"
import { sendEvent } from "~/server/events"
import { parseListingMetadata } from "~/server/products/listing"
import { enrichTool } from "~/server/tools/enrichment"
import { db } from "~/services/db"
import { getStripeClient, isStripeEnabled } from "~/services/stripe"

/**
 * The owner fields a paid checkout sets. The payer owns a listing that has no owner yet, and a
 * payer whose verified email is on the tool's domain also verifies it. Checkout already turned
 * away anyone else, but the tool can change hands before the payment completes.
 */
async function getPayerOwnership(
  tool: Pick<Tool, "ownerId" | "verifiedAt" | "websiteUrl">,
  userId: string | null,
) {
  const user = userId ? await db.user.findUnique({ where: { id: userId } }) : null

  if (!user || !canOwnTool(tool, user)) {
    return {}
  }

  const isVerifying = !tool.verifiedAt && isUserOnDomain(user, tool.websiteUrl)

  return { ownerId: user.id, ...(isVerifying && { verifiedAt: new Date() }) }
}

/**
 * Apply a paid listing checkout. The server writes the metadata when it creates the
 * session, so the tier in it is trusted. A redelivered event finds the tier already
 * applied and does nothing.
 */
async function upgradeListing(session: Stripe.Checkout.Session) {
  const listing = parseListingMetadata(session.metadata)

  // The account can sell things that aren't listings.
  if (!listing) {
    return
  }

  // A listing session without a valid tier can't be applied, but the customer has paid.
  // Throwing fails the delivery, so it shows up in the Stripe dashboard and gets retried.
  if (!listing.tier) {
    throw new Error(`Paid checkout ${session.id} has no valid tier in its metadata.`)
  }

  const existingTool = await db.tool.findFirst({ where: listing.where })

  if (!existingTool) {
    throw new Error(`Paid checkout ${session.id} references a missing tool.`)
  }

  if (!isToolTierUpgrade(existingTool, listing.tier)) {
    return
  }

  // Checkout stores the signed-in payer as the session's client reference.
  const ownership = await getPayerOwnership(existingTool, session.client_reference_id)

  const tool = await db.tool.update({
    where: { id: existingTool.id },
    data: { tier: listing.tier, ...ownership },
  })

  // The checkout may have redeemed a coupon, so the cached coupon is stale.
  revalidateTag("stripe-coupon", "infinite")

  sendEvent("tool.tier_upgraded", {
    toolId: tool.id,
    previousTier: existingTool.tier,
    newTier: tool.tier,
  })

  // A paid listing goes to admin review, so fill in its missing copy and media first.
  after(async () => {
    await enrichTool(tool)
  })
}

/**
 * Revoke the tier an ended subscription granted. The tool returns to the tier it had
 * before the subscription, so an earlier one-time purchase survives the cancellation.
 */
async function downgradeListing(subscription: Stripe.Subscription) {
  const listing = parseListingMetadata(subscription.metadata)

  if (!listing) {
    return
  }

  const existingTool = await db.tool.findFirst({ where: listing.where })

  // A tool an admin has since moved to another tier keeps that tier.
  if (!existingTool || (listing.tier && existingTool.tier !== listing.tier)) {
    return
  }

  if (!isToolTierUpgrade({ tier: listing.previousTier }, existingTool.tier)) {
    return
  }

  const tool = await db.tool.update({
    where: { id: existingTool.id },
    data: { tier: listing.previousTier },
  })

  sendEvent("tool.tier_downgraded", {
    toolId: tool.id,
    previousTier: existingTool.tier,
    newTier: tool.tier,
  })
}

export async function POST(request: Request) {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET

  // Without Stripe there are no events to receive, so the route does not exist.
  if (!isStripeEnabled || !webhookSecret) {
    return new Response("Not found.", { status: 404 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")
  let event: Stripe.Event

  if (!signature) {
    return new Response("Missing Stripe signature.", { status: 400 })
  }

  try {
    event = getStripeClient().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error("Stripe webhook verification failed:", error)
    return new Response(`Webhook Error: ${getErrorMessage(error)}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object

        // A delayed payment method (SEPA, bank transfer) completes the checkout before the
        // money arrives, so it never upgrades on its own. An admin sets the tier once the
        // payment settles.
        if (session.payment_status === "unpaid") {
          console.warn(`Skipping tier upgrade for unpaid checkout ${session.id}`)
          break
        }

        await upgradeListing(session)
        break
      }

      case "customer.subscription.deleted": {
        await downgradeListing(event.data.object)
        break
      }
    }
  } catch (error) {
    console.error("Stripe webhook handler failed:", error)
    return new Response(`Webhook handler failed: ${getErrorMessage(error)}`, { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }))
}
