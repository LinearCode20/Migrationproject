"use client"

import { useMutation } from "@tanstack/react-query"
import { getAttributionId } from "highseat"
import { ArrowUpRightIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { type ComponentProps, type ReactNode, useState, useTransition } from "react"
import { toast } from "sonner"
import type Stripe from "stripe"
import type { z } from "zod"
import { Button } from "~/components/common/button"
import type { Card } from "~/components/common/card"
import { LoginDialog } from "~/components/web/auth/login-dialog"
import { Price } from "~/components/web/price"
import { PricingCard } from "~/components/web/pricing-card"
import { ProductFeatures } from "~/components/web/products/product-features"
import { ProductIntervalSwitch } from "~/components/web/products/product-interval-switch"
import { useProductInterval } from "~/contexts/product-interval-context"
import { useProductPrices } from "~/hooks/use-product-prices"
import { useTrackEvent } from "~/hooks/use-track-event"
import { useSession } from "~/lib/auth-client"
import { orpc } from "~/lib/orpc-query"
import { getProductFeatures, type ProductFeature } from "~/lib/products"
import type { checkoutSchema } from "~/server/products/schema"

interface ProductData {
  product: Stripe.Product
  prices: Stripe.Price[]
  coupon?: Stripe.Coupon
}

interface ProductCheckoutData extends Omit<z.input<typeof checkoutSchema>, "priceId"> {
  successUrl: string
}

interface ProductProps extends ComponentProps<typeof Card> {
  data: ProductData
  checkoutData: ProductCheckoutData
  /** Rows shown before the product's own marketing features. */
  features?: ProductFeature[]
  isHighlighted?: boolean
  isDisabled?: boolean
  buttonLabel?: ReactNode
}

export function Product({
  data,
  checkoutData,
  features: extraFeatures = [],
  isHighlighted,
  isDisabled,
  buttonLabel,
  ...props
}: ProductProps) {
  const { product, prices, coupon } = data
  const router = useRouter()
  const trackEvent = useTrackEvent()
  const features = [...extraFeatures, ...getProductFeatures(product)]
  const t = useTranslations("components.product")
  const { showSwitch } = useProductInterval()
  const { data: session } = useSession()
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const { isSubscription, currentPrice, price, fullPrice, discount, currency, interval } =
    useProductPrices(prices, coupon)

  const { mutate, isPending } = useMutation(
    orpc.products.createCheckout.mutationOptions({
      onSuccess: data => {
        // The tier only, never the buyer's email or other personal data.
        trackEvent("start_checkout", { tier: product.metadata.tier })
        window.location.assign(data.url)
      },
      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  // Covers the wait for the attribution id, before the checkout mutation is pending.
  const [isStarting, startCheckout] = useTransition()

  function onSubmit() {
    const { successUrl, ...checkout } = checkoutData

    if (!currentPrice?.id || !currentPrice.unit_amount) {
      router.push(successUrl)
      return
    }

    // The payer becomes the tool's owner, so a guest signs in before checkout.
    if (!session?.user) {
      setShowLoginDialog(true)
      return
    }

    const priceId = currentPrice.id

    startCheckout(async () => {
      // The attribution id joins the Stripe sale to this tab's visit. It resolves to undefined
      // at once when the tracker is blocked and within three seconds when it is slow, and never
      // throws, so the checkout always proceeds.
      const attributionId = await getAttributionId()

      mutate({ ...checkout, priceId, attributionId })
    })
  }

  return (
    <PricingCard
      name={product.name}
      description={product.description}
      headerAction={showSwitch && isSubscription && prices.length > 1 && <ProductIntervalSwitch />}
      isHighlighted={isHighlighted}
      isDisabled={isDisabled}
      {...props}
    >
      <Price
        price={price}
        fullPrice={fullPrice}
        interval={isSubscription ? t(`price_period.${interval}`) : undefined}
        discount={discount}
        coupon={coupon}
        currency={currency}
        format={{ notation: "standard", minimumFractionDigits: 0, maximumFractionDigits: 0 }}
        className="w-full text-[2.5em]"
      />

      <ProductFeatures features={features} />

      <Button
        variant={isHighlighted ? "primary" : "secondary"}
        isPending={isPending || isStarting}
        disabled={isPending || isDisabled}
        suffix={<ArrowUpRightIcon />}
        onClick={onSubmit}
      >
        {buttonLabel}
      </Button>

      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        description={t("sign_in_description")}
      />
    </PricingCard>
  )
}
