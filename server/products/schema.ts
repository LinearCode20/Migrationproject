import { z } from "zod"

/**
 * A listing checkout names only the tool, the chosen price, an optional discount code and the
 * analytics attribution id.
 * The server derives everything else (mode, metadata, redirect URLs, the discount itself)
 * from the tool and the product catalog, so a client can't send its own.
 */
export const checkoutSchema = z.object({
  toolId: z.string().min(1),
  priceId: z.string().min(1),
  discountCode: z.string().optional(),
  /** The Highseat tracker's id for this tab's visit, so the sale is credited to it. */
  attributionId: z.string().max(255).optional(),
})

/**
 * A billing portal session names only the tool. The server finds the customer who pays for it.
 */
export const billingPortalSchema = z.object({
  toolId: z.string().min(1),
})
